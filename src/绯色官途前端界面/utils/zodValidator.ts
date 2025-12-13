/**
 * ZOD 验证工具
 * 用于验证 JSON Patch 更新语句是否符合 GameSchema
 *
 * 注意：此验证工具使用前端的 GameSchema 进行验证。
 * 如果需要修改验证规则，请更新 stores/schema.ts 文件。
 *
 * 可扩展性说明：
 * - GameSchema 定义在 stores/schema.ts 中
 * - 开发者可以通过修改 schema.ts 来更新验证规则
 * - 枚举值、字段类型等都可以在 schema.ts 中配置
 */

import { z } from 'zod';
import { GameSchema } from '../stores/schema';

// 启用调试日志 - 调试时设为 true
const DEBUG_VALIDATION = true;

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  value: unknown;
  message: string;
  code: string;
}

// 解析 JSON Patch 路径为数组
function parseJsonPatchPath(path: string): string[] {
  // JSON Patch 路径格式: /a/b/c
  if (!path.startsWith('/')) {
    return path.split('/').filter(Boolean);
  }
  return path.slice(1).split('/').filter(Boolean);
}

// 获取 zod schema 的类型名称
// 兼容 Zod v3 (typeName) 和 Zod v4 (type)
function getZodTypeName(schema: z.ZodTypeAny): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const def = (schema as any)?._def;
  if (!def) return '';

  // Zod v4: 使用 _def.type
  if (def.type && typeof def.type === 'string') {
    return def.type;
  }

  // Zod v3: 使用 _def.typeName
  if (def.typeName && typeof def.typeName === 'string') {
    return def.typeName;
  }

  // 尝试从 shape 推断是否为 object 类型
  if (def.shape !== undefined) {
    return 'object';
  }

  return '';
}

// 根据路径获取嵌套的 schema
function getSchemaAtPath(schema: z.ZodTypeAny, pathParts: string[]): z.ZodTypeAny | null {
  let current = schema;
  let i = 0;

  if (DEBUG_VALIDATION) {
    console.log('[ZOD验证] getSchemaAtPath 开始:', pathParts, '初始类型:', getZodTypeName(schema));
  }

  while (i < pathParts.length) {
    const part = pathParts[i];
    const typeName = getZodTypeName(current);

    if (DEBUG_VALIDATION) {
      console.log('[ZOD验证] 路径步骤:', { i, part, typeName, remainingPath: pathParts.slice(i) });
    }

    // 先解包包装类型 - 递归解包直到得到实际类型
    // 兼容 Zod v3 和 v4 的各种包装类型
    const typeNameLower = typeName.toLowerCase();
    const def = (current as any)._def || {};

    // 解包 optional/default/prefault 类型
    if (
      typeName === 'ZodOptional' ||
      typeName === 'ZodDefault' ||
      typeName === 'ZodPrefault' ||
      typeNameLower === 'optional' ||
      typeNameLower === 'default' ||
      typeNameLower === 'prefault'
    ) {
      current = def.innerType;
      continue; // 不消耗 path part
    }

    // 解包 effects/transform 类型 - Zod v4 使用 _def.in 而不是 _def.schema
    if (typeName === 'ZodEffects' || typeNameLower === 'effects' || typeNameLower === 'transform') {
      // 优先尝试 _def.in (Zod v4)，其次 _def.schema (Zod v3)
      current = def.in || def.schema;
      if (!current) {
        if (DEBUG_VALIDATION) {
          console.log('[ZOD验证] transform/effects 解包失败，_def 键:', Object.keys(def));
        }
        return null;
      }
      continue; // 不消耗 path part
    }

    // 解包 pipe 类型 (Zod v4) - 需要获取输入类型而不是输出类型
    // pipe 的 _def 有 in (输入 schema) 和 out (输出 schema)
    // 对于验证路径，我们需要输入类型，因为那是原始结构
    if (typeName === 'pipe' || typeNameLower === 'pipe') {
      // 对于路径解析，使用 in（输入 schema）而不是 out
      current = def.in || def.out;
      if (!current) {
        if (DEBUG_VALIDATION) {
          console.log('[ZOD验证] pipe 解包失败，_def 键:', Object.keys(def));
        }
        return null;
      }
      continue; // 不消耗 path part
    }

    // 解析实际类型 - 兼容 Zod v3 和 v4
    // Zod v3: ZodObject, Zod v4: object
    if (typeName === 'ZodObject' || typeName === 'object') {
      const shape = (current as any).shape || def.shape;
      if (shape && part in shape) {
        current = shape[part];
        i++;
      } else {
        if (DEBUG_VALIDATION) {
          console.log('[ZOD验证] 对象中没有属性:', part, '可用属性:', shape ? Object.keys(shape) : []);
        }
        return null;
      }
    } else if (typeName === 'ZodRecord' || typeName === 'record') {
      // record 类型，任意键都对应值的 schema
      // Zod v4 可能使用 valueType 或 valueSchema
      current = def.valueType || def.valueSchema;
      if (!current) {
        if (DEBUG_VALIDATION) {
          console.log('[ZOD验证] record 解包失败，_def 键:', Object.keys(def));
        }
        return null;
      }
      i++;
    } else if (typeName === 'ZodArray' || typeName === 'array') {
      // 数组类型，获取元素的 schema
      // JSON Patch 中 '-' 表示数组末尾追加，也是有效索引
      const index = parseInt(part, 10);
      if (!isNaN(index) || part === '-') {
        // Zod v4 可能使用 element 而不是 type
        current = def.type || def.element;
        if (!current) {
          if (DEBUG_VALIDATION) {
            console.log('[ZOD验证] array 解包失败，_def 键:', Object.keys(def));
          }
          return null;
        }
        i++;
      } else {
        return null;
      }
    } else {
      if (DEBUG_VALIDATION) {
        console.log('[ZOD验证] 无法继续解析的类型:', typeName, '当前部分:', part, '_def 键:', Object.keys(def));
      }
      // 无法继续解析（到达叶子节点但还有路径）
      return null;
    }
  }

  // 最终解包 - 兼容 Zod v3 和 v4
  // 递归解包直到得到实际的验证类型
  let finalTypeName = getZodTypeName(current);
  let finalTypeNameLower = finalTypeName.toLowerCase();
  let maxIterations = 20; // 防止无限循环

  while (maxIterations-- > 0) {
    finalTypeName = getZodTypeName(current);
    finalTypeNameLower = finalTypeName.toLowerCase();
    const def = (current as any)?._def || {};

    if (
      finalTypeName === 'ZodOptional' ||
      finalTypeName === 'ZodDefault' ||
      finalTypeName === 'ZodPrefault' ||
      finalTypeNameLower === 'optional' ||
      finalTypeNameLower === 'default' ||
      finalTypeNameLower === 'prefault'
    ) {
      current = def.innerType;
    } else if (finalTypeNameLower === 'pipe') {
      // Zod v4 pipe 类型 - 使用 in 获取输入类型
      current = def.in || def.out;
    } else if (
      finalTypeName === 'ZodEffects' ||
      finalTypeNameLower === 'effects' ||
      finalTypeNameLower === 'transform'
    ) {
      // Zod v4 transform 类型 - 使用 in 获取输入类型
      current = def.in || def.schema;
    } else {
      // 不是包装类型，退出循环
      break;
    }

    // 如果解包失败，退出循环
    if (!current) {
      if (DEBUG_VALIDATION) {
        console.log('[ZOD验证] 最终解包失败，类型:', finalTypeName);
      }
      break;
    }
  }

  return current;
}

// 验证单个值
export function validateValue(path: string, value: unknown): ValidationError | null {
  try {
    const pathParts = parseJsonPatchPath(path);

    if (pathParts.length === 0) {
      if (DEBUG_VALIDATION) console.log('[ZOD验证] 路径为空，跳过验证:', path);
      return null;
    }

    const targetSchema = getSchemaAtPath(GameSchema, pathParts);

    if (!targetSchema) {
      // 无法找到对应的 schema，可能是动态路径，跳过验证
      if (DEBUG_VALIDATION) console.log('[ZOD验证] 未找到 schema，跳过验证:', path, pathParts);
      return null;
    }

    if (DEBUG_VALIDATION) {
      console.log('[ZOD验证] 验证路径:', path);
      console.log('[ZOD验证] Schema 类型:', getZodTypeName(targetSchema));
      console.log('[ZOD验证] 值:', value);
    }

    // 使用 safeParse 进行验证
    const result = targetSchema.safeParse(value);

    if (result.success) {
      if (DEBUG_VALIDATION) console.log('[ZOD验证] 验证通过:', path);
      return null;
    }

    // 验证失败，提取第一个错误
    // Zod v3 使用 errors，Zod v4 使用 issues
    const errorList = (result.error as any).errors || (result.error as any).issues || [];
    const firstError = errorList[0];
    if (firstError) {
      // 构建完整的错误路径
      const errorPath = firstError.path?.length > 0 ? `${path}/${firstError.path.join('/')}` : path;

      if (DEBUG_VALIDATION) {
        console.log('[ZOD验证] 验证失败:', errorPath);
        console.log('[ZOD验证] 错误信息:', firstError.message);
      }

      return {
        path: errorPath,
        value,
        message: firstError.message,
        code: firstError.code,
      };
    }

    return {
      path,
      value,
      message: '验证失败',
      code: 'unknown',
    };
  } catch (error) {
    // 路径解析或 schema 查找失败，跳过验证
    console.warn('[ZOD验证] 验证异常:', path, error);
    return null;
  }
}

// 验证一组 JSON Patch 命令
export interface ParsedCommand {
  type: string;
  path: string;
  value?: unknown;
  reason?: string;
}

export function validateCommands(commands: ParsedCommand[]): ValidationResult {
  try {
    const errors: ValidationError[] = [];

    if (DEBUG_VALIDATION) {
      console.log('[ZOD验证] 开始验证命令，共', commands.length, '条');
    }

    for (const cmd of commands) {
      // 只验证有值的命令（set, replace, add, insert, assign）
      if (cmd.value !== undefined && ['set', 'replace', 'add', 'insert', 'assign'].includes(cmd.type)) {
        if (DEBUG_VALIDATION) {
          console.log('[ZOD验证] 验证命令:', cmd.type, cmd.path);
        }

        const error = validateValue(cmd.path, cmd.value);
        if (error) {
          errors.push(error);
          if (DEBUG_VALIDATION) {
            console.log('[ZOD验证] 发现错误:', error);
          }
        }
      }
    }

    if (DEBUG_VALIDATION) {
      console.log('[ZOD验证] 验证完成，错误数:', errors.length);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.warn('[ZOD验证] 批量验证失败:', error);
    // 验证失败时默认允许通过，避免阻塞用户
    return {
      isValid: true,
      errors: [],
    };
  }
}

// 获取路径的预期类型描述
export function getExpectedTypeDescription(path: string): string {
  try {
    const pathParts = parseJsonPatchPath(path);
    const schema = getSchemaAtPath(GameSchema, pathParts);

    if (!schema) {
      return '未知类型';
    }

    const typeName = getZodTypeName(schema);
    const typeNameLower = typeName.toLowerCase();

    // 尝试获取类型描述 - 兼容 Zod v3 和 v4
    if (typeName === 'ZodEnum' || typeName === 'enum') {
      const values = (schema as any)._def.values as string[];
      return `枚举值: ${values.join(' | ')}`;
    }
    if (typeName === 'ZodNumber' || typeName === 'number' || typeNameLower === 'number') {
      return '数字';
    }
    if (typeName === 'ZodString' || typeName === 'string' || typeNameLower === 'string') {
      return '文本';
    }
    if (typeName === 'ZodBoolean' || typeName === 'boolean' || typeNameLower === 'boolean') {
      return '布尔值 (true/false)';
    }
    if (typeName === 'ZodArray' || typeName === 'array') {
      return '数组';
    }
    if (typeName === 'ZodObject' || typeName === 'object') {
      return '对象';
    }
    if (typeName === 'ZodEffects' || typeNameLower === 'effects' || typeNameLower === 'transform') {
      // 可能是 transform 后的类型
      return '文本/数字';
    }

    return '未知类型';
  } catch (error) {
    console.warn('[ZOD验证] 获取类型描述失败:', error);
    return '未知类型';
  }
}
