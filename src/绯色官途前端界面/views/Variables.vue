<template>
  <div class="variables-page">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input v-model="searchQuery" type="text" placeholder="搜索字段名或内容..." />
      </div>
      <div class="toolbar-actions">
        <label class="toggle-filled">
          <input v-model="onlyFilled" type="checkbox" />
          <span>仅显示已填写</span>
        </label>
        <button class="action-btn" @click="expandAll"><i class="fas fa-expand"></i> 全部展开</button>
        <button class="action-btn" @click="collapseAll"><i class="fas fa-compress"></i> 全部折叠</button>
        <button class="action-btn" @click="handleExport"><i class="fas fa-download"></i> 导出</button>
        <button class="action-btn" @click="showImportModal = true"><i class="fas fa-upload"></i> 导入</button>
        <button class="action-btn danger" @click="showClearCacheConfirm = true">
          <i class="fas fa-trash-alt"></i> 清除头像缓存
        </button>
        <button class="save-btn" :disabled="!isDirty" @click="saveAll"><i class="fas fa-save"></i> 保存全部</button>
        <!-- 开局模式下显示"确认当前开局"按钮 -->
        <button v-if="isStartupMode" class="startup-btn" @click="showStartupConfirm = true">
          <i class="fas fa-play-circle"></i> 确认当前开局
        </button>
      </div>
    </div>

    <!-- 分区列表 -->
    <div class="sections-list">
      <!-- 无匹配结果提示 -->
      <div v-if="!Object.values(sectionVisible).some(v => v)" class="empty-search-result">
        <i class="fas fa-search"></i>
        <p>没有找到匹配的内容</p>
      </div>

      <!-- 时空舆情 -->
      <SectionAccordion
        v-show="sectionVisible.时空舆情"
        ref="section时空舆情"
        title="时空舆情"
        icon="fas fa-globe"
        :expanded="expanded.时空舆情"
        :filled-count="countFilled(data.时空舆情)"
        :total-count="countTotal(data.时空舆情)"
        :dirty="sectionDirty.时空舆情"
        @toggle="expanded.时空舆情 = $event"
        @save="saveSection('时空舆情')"
      >
        <div class="field-group">
          <div class="field-row">
            <label>当前日期 · 年</label>
            <input v-model.number="data.时空舆情.当前日期.年" type="number" min="2000" max="2100" />
          </div>
          <div class="field-row">
            <label>当前日期 · 月</label>
            <input v-model.number="data.时空舆情.当前日期.月" type="number" min="1" max="12" />
          </div>
          <div class="field-row">
            <label>当前日期 · 日</label>
            <input v-model.number="data.时空舆情.当前日期.日" type="number" min="1" max="31" />
          </div>
          <div class="field-row">
            <label>当前日期 · 星期</label>
            <select v-model="data.时空舆情.当前日期.星期">
              <option v-for="d in weekdays" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="field-row">
            <label>当前时间</label>
            <input v-model="data.时空舆情.当前时间" type="text" placeholder="HH:MM 或 无" />
          </div>
          <div class="field-row">
            <label>当前地点</label>
            <input v-model="data.时空舆情.当前地点" type="text" />
          </div>
          <div class="field-row">
            <label>政治气候</label>
            <span class="computed-value">{{ data.时空舆情.政治气候 }}</span>
          </div>
          <div class="field-row full">
            <label>重大事件</label>
            <input v-model="data.时空舆情.重大事件" type="text" />
          </div>
          <div class="field-row full">
            <label>中央动态</label>
            <textarea v-model="data.时空舆情.中央动态" rows="2"></textarea>
          </div>
          <div class="field-row full">
            <label>省内风向</label>
            <textarea v-model="data.时空舆情.省内风向" rows="2"></textarea>
          </div>
          <div class="field-row full">
            <label>本地新闻</label>
            <textarea v-model="data.时空舆情.本地新闻" rows="2"></textarea>
          </div>
          <div class="field-row full">
            <label>圈内传闻</label>
            <textarea v-model="data.时空舆情.圈内传闻" rows="2"></textarea>
          </div>
          <div class="field-row full">
            <label>个人风评</label>
            <textarea v-model="data.时空舆情.个人风评" rows="2"></textarea>
          </div>
        </div>
      </SectionAccordion>

      <!-- 当前场景 -->
      <SectionAccordion
        v-show="sectionVisible.当前场景"
        ref="section当前场景"
        title="当前场景"
        icon="fas fa-map-location-dot"
        :expanded="expanded.当前场景"
        :filled-count="countFilled(data.当前场景)"
        :total-count="countTotal(data.当前场景)"
        :dirty="sectionDirty.当前场景"
        @toggle="expanded.当前场景 = $event"
        @save="saveSection('当前场景')"
      >
        <div class="field-group">
          <div class="field-row">
            <label>场景类型</label>
            <input v-model="data.当前场景.场景类型" type="text" />
          </div>
          <div class="field-row full">
            <label>场景速写</label>
            <textarea v-model="data.当前场景.场景速写" rows="3"></textarea>
          </div>
          <div class="field-row">
            <label>气氛基调</label>
            <input v-model="data.当前场景.气氛基调" type="text" />
          </div>
          <div class="field-row full">
            <label>在场人物</label>
            <ArrayEditor v-model="data.当前场景.在场人物" :suggestions="人物名单" />
          </div>
          <div class="field-row full">
            <label>潜在议题</label>
            <textarea v-model="data.当前场景.潜在议题" rows="2"></textarea>
          </div>
        </div>
      </SectionAccordion>

      <!-- 关系索引 -->
      <SectionAccordion
        v-show="sectionVisible.关系索引"
        ref="section关系索引"
        title="关系索引"
        icon="fas fa-diagram-project"
        :expanded="expanded.关系索引"
        :filled-count="countFilled(data.关系索引)"
        :total-count="countTotal(data.关系索引)"
        :dirty="sectionDirty.关系索引"
        @toggle="expanded.关系索引 = $event"
        @save="saveSection('关系索引')"
      >
        <div class="field-group">
          <div class="field-row">
            <label>一把手</label>
            <input v-model="data.关系索引.一把手" type="text" placeholder="一把手姓名" />
          </div>
          <div class="field-row">
            <label>直接上级</label>
            <input v-model="data.关系索引.直接上级" type="text" placeholder="直接上级姓名" />
          </div>
          <div class="field-row">
            <label>配偶</label>
            <input v-model="data.关系索引.配偶" type="text" placeholder="配偶姓名" />
          </div>
          <div class="field-row full">
            <label>靠山列表</label>
            <ArrayEditor v-model="data.关系索引.靠山列表" :suggestions="人物名单" />
          </div>
          <div class="field-row full">
            <label>竞争对手列表</label>
            <ArrayEditor v-model="data.关系索引.竞争对手列表" :suggestions="人物名单" />
          </div>
          <div class="field-row full">
            <label>绯色对象列表</label>
            <ArrayEditor v-model="data.关系索引.绯色对象列表" :suggestions="人物名单" />
          </div>
          <div class="field-row full">
            <label>核心嫡系列表</label>
            <ArrayEditor v-model="data.关系索引.核心嫡系列表" :suggestions="人物名单" />
          </div>
          <div class="field-row full">
            <label>政治宿敌列表</label>
            <ArrayEditor v-model="data.关系索引.政治宿敌列表" :suggestions="人物名单" />
          </div>
        </div>
      </SectionAccordion>

      <!-- 人物库 -->
      <SectionAccordion
        v-show="sectionVisible.人物库"
        ref="section人物库"
        title="人物库"
        icon="fas fa-users"
        :expanded="expanded.人物库"
        :show-count="false"
        :dirty="sectionDirty.人物库"
        @toggle="expanded.人物库 = $event"
        @save="saveSection('人物库')"
      >
        <template #meta>
          <span class="field-count">{{ Object.keys(data.人物库).length }} 人</span>
        </template>
        <RecordTable v-model="data.人物库" :meta-fields="['职务', '级别']" add-text="新增人物" @add="addCharacter">
          <template #item="{ item, update }">
            <div class="char-editor">
              <div class="field-grid">
                <div class="field-row">
                  <label>姓名</label>
                  <input type="text" :value="item.姓名" disabled />
                </div>
                <div class="field-row">
                  <label>性别</label>
                  <select :value="item.性别" @change="update({ 性别: ($event.target as HTMLSelectElement).value })">
                    <option value="无">无</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
                <div class="field-row">
                  <label>年龄</label>
                  <input
                    type="number"
                    :value="item.年龄"
                    min="0"
                    max="120"
                    @input="update({ 年龄: ($event.target as HTMLInputElement).valueAsNumber })"
                  />
                </div>
                <div class="field-row">
                  <label>体系</label>
                  <select :value="item.体系" @change="update({ 体系: ($event.target as HTMLSelectElement).value })">
                    <option v-for="t in ['无', '党政', '军队', '事业', '国企']" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="field-row">
                  <label>级别</label>
                  <input
                    type="text"
                    :value="item.级别"
                    @input="update({ 级别: ($event.target as HTMLInputElement).value })"
                  />
                </div>
                <div class="field-row">
                  <label>职务</label>
                  <input
                    type="text"
                    :value="item.职务"
                    @input="update({ 职务: ($event.target as HTMLInputElement).value })"
                  />
                </div>
                <div class="field-row">
                  <label>好感度</label>
                  <SliderField
                    :model-value="item.好感度"
                    :show-value="false"
                    @update:model-value="update({ 好感度: $event })"
                  />
                </div>
                <div class="field-row">
                  <label>信任度</label>
                  <SliderField
                    :model-value="item.信任度"
                    :show-value="false"
                    @update:model-value="update({ 信任度: $event })"
                  />
                </div>
              </div>
            </div>
          </template>
        </RecordTable>
      </SectionAccordion>

      <!-- 个人档案 -->
      <SectionAccordion
        v-show="sectionVisible.个人档案"
        ref="section个人档案"
        title="个人档案"
        icon="fas fa-id-card"
        :expanded="expanded.个人档案"
        :filled-count="countFilled(data.个人档案)"
        :total-count="countTotal(data.个人档案)"
        :dirty="sectionDirty.个人档案"
        @toggle="expanded.个人档案 = $event"
        @save="saveSection('个人档案')"
      >
        <!-- 基本信息子区块 -->
        <div class="sub-section">
          <h5><i class="fas fa-user"></i> 基本信息</h5>
          <div class="field-group">
            <div class="field-row">
              <label>姓名</label>
              <input v-model="data.个人档案.基本信息.姓名" type="text" />
            </div>
            <div class="field-row">
              <label>性别</label>
              <select v-model="data.个人档案.基本信息.性别">
                <option value="无">无</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>
            <div class="field-row">
              <label>年龄</label>
              <input v-model.number="data.个人档案.基本信息.年龄" type="number" min="0" max="120" />
            </div>
            <div class="field-row">
              <label>民族</label>
              <input v-model="data.个人档案.基本信息.民族" type="text" />
            </div>
            <div class="field-row">
              <label>籍贯</label>
              <input v-model="data.个人档案.基本信息.籍贯" type="text" />
            </div>
            <div class="field-row">
              <label>学历</label>
              <input v-model="data.个人档案.基本信息.学历" type="text" />
            </div>
            <div class="field-row">
              <label>毕业院校</label>
              <input v-model="data.个人档案.基本信息.毕业院校" type="text" />
            </div>
            <div class="field-row">
              <label>入党时间</label>
              <input v-model="data.个人档案.基本信息.入党时间" type="text" />
            </div>
            <div class="field-row">
              <label>参加工作时间</label>
              <input v-model="data.个人档案.基本信息.参加工作时间" type="text" />
            </div>
          </div>
        </div>

        <!-- 能力评估子区块 -->
        <div class="sub-section">
          <h5><i class="fas fa-chart-radar"></i> 能力评估</h5>
          <div class="stats-grid">
            <SliderField v-model="data.个人档案.能力评估.公文笔杆" label="公文笔杆" />
            <SliderField v-model="data.个人档案.能力评估.揣摩上意" label="揣摩上意" />
            <SliderField v-model="data.个人档案.能力评估.资源整合" label="资源整合" />
            <SliderField v-model="data.个人档案.能力评估.人脉经营" label="人脉经营" />
            <SliderField v-model="data.个人档案.能力评估.政治敏感" label="政治敏感" />
            <SliderField v-model="data.个人档案.能力评估.执行魄力" label="执行魄力" />
            <SliderField v-model="data.个人档案.能力评估.酒桌功夫" label="酒桌功夫" />
            <SliderField v-model="data.个人档案.能力评估.魅力风度" label="魅力风度" />
            <SliderField v-model="data.个人档案.能力评估.表演功底" label="表演功底" />
            <SliderField v-model="data.个人档案.能力评估.厚黑指数" label="厚黑指数" />
          </div>
        </div>

        <!-- 现任职务子区块 -->
        <div class="sub-section">
          <h5><i class="fas fa-briefcase"></i> 现任职务</h5>
          <div class="field-group">
            <div class="field-row">
              <label>职务名称</label>
              <input v-model="data.个人档案.现任职务.职务名称" type="text" />
            </div>
            <div class="field-row">
              <label>任职单位</label>
              <input v-model="data.个人档案.现任职务.任职单位" type="text" />
            </div>
            <div class="field-row">
              <label>体系</label>
              <select v-model="data.个人档案.现任职务.体系">
                <option v-for="t in ['无', '党政', '军队', '事业', '国企']" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="field-row">
              <label>级别</label>
              <input v-model="data.个人档案.现任职务.级别" type="text" />
            </div>
            <div class="field-row">
              <label>编制类型</label>
              <input v-model="data.个人档案.现任职务.编制类型" type="text" />
            </div>
            <div class="field-row">
              <label>任职时间</label>
              <input v-model="data.个人档案.现任职务.任职时间" type="text" />
            </div>
            <div class="field-row">
              <label>任期预期</label>
              <input v-model="data.个人档案.现任职务.任期预期" type="text" />
            </div>
            <div class="field-row full">
              <label>前任情况</label>
              <textarea v-model="data.个人档案.现任职务.前任情况" rows="2"></textarea>
            </div>
            <div class="field-row full">
              <label>前任遗留</label>
              <textarea v-model="data.个人档案.现任职务.前任遗留" rows="2"></textarea>
            </div>
          </div>
          <!-- 兼任职务 -->
          <div class="nested-section">
            <h6><i class="fas fa-briefcase"></i> 兼任职务</h6>
            <RecordTable
              v-model="data.个人档案.现任职务.兼任职务"
              :meta-fields="['职务名称']"
              add-text="新增兼任"
              @add="addRecord('个人档案.现任职务.兼任职务', '兼任职务')"
            />
          </div>
          <!-- 分管领域 -->
          <div class="nested-section">
            <h6><i class="fas fa-sitemap"></i> 分管领域</h6>
            <RecordTable
              v-model="data.个人档案.现任职务.分管领域"
              :meta-fields="['领域名称']"
              add-text="新增领域"
              @add="addRecord('个人档案.现任职务.分管领域', '分管领域')"
            />
          </div>
        </div>

        <!-- 晋升状态子区块 -->
        <div class="sub-section">
          <h5><i class="fas fa-chart-line"></i> 晋升状态</h5>
          <div class="field-group">
            <div class="field-row">
              <label>是否冻结</label>
              <select v-model="data.个人档案.晋升状态.是否冻结">
                <option :value="false">否</option>
                <option :value="true">是</option>
              </select>
            </div>
            <div class="field-row">
              <label>冻结原因</label>
              <input v-model="data.个人档案.晋升状态.冻结原因" type="text" />
            </div>
            <div class="field-row">
              <label>预计解除</label>
              <input v-model="data.个人档案.晋升状态.预计解除" type="text" />
            </div>
            <div class="field-row">
              <label>下一目标</label>
              <input v-model="data.个人档案.晋升状态.下一目标" type="text" />
            </div>
          </div>
        </div>

        <!-- 政治生态子区块 -->
        <div class="sub-section">
          <h5><i class="fas fa-balance-scale"></i> 政治生态</h5>
          <div class="field-group">
            <div class="field-row">
              <label>派系归属</label>
              <input v-model="data.个人档案.政治生态.派系归属" type="text" />
            </div>
            <div class="field-row">
              <label>政治立场</label>
              <input v-model="data.个人档案.政治生态.政治立场" type="text" />
            </div>
            <div class="field-row">
              <label>官声</label>
              <input v-model="data.个人档案.政治生态.官声" type="text" />
            </div>
            <div class="field-row">
              <label>群众基础</label>
              <input v-model="data.个人档案.政治生态.群众基础" type="text" />
            </div>
            <div class="field-row">
              <label>年度考核</label>
              <input v-model="data.个人档案.政治生态.年度考核" type="text" />
            </div>
            <div class="field-row">
              <label>班子内站位</label>
              <input v-model="data.个人档案.政治生态.班子内站位" type="text" />
            </div>
          </div>
        </div>

        <!-- 任职履历 -->
        <div class="sub-section">
          <h5><i class="fas fa-history"></i> 任职履历</h5>
          <RecordTable
            v-model="data.个人档案.任职履历"
            :meta-fields="['职务名称', '单位']"
            add-text="新增履历"
            :show-toolbar="true"
            @add="addRecord('个人档案.任职履历', '履历')"
          />
        </div>

        <!-- 在手项目 -->
        <div class="sub-section">
          <h5><i class="fas fa-tasks"></i> 在手项目</h5>
          <RecordTable
            v-model="data.个人档案.在手项目"
            :meta-fields="['项目名称', '进展状态']"
            add-text="新增项目"
            @add="addRecord('个人档案.在手项目', '项目')"
          >
            <template #item="{ item, update }">
              <div class="record-editor">
                <div class="field-grid">
                  <div class="field-row">
                    <label>项目名称</label>
                    <input
                      type="text"
                      :value="item.项目名称"
                      @input="update({ 项目名称: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>角色定位</label>
                    <input
                      type="text"
                      :value="item.角色定位"
                      @input="update({ 角色定位: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>进展状态</label>
                    <input
                      type="text"
                      :value="item.进展状态"
                      @input="update({ 进展状态: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>政治效益</label>
                    <input
                      type="text"
                      :value="item.政治效益"
                      @input="update({ 政治效益: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>风险等级</label>
                    <input
                      type="text"
                      :value="item.风险等级"
                      @input="update({ 风险等级: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>预计完成</label>
                    <input
                      type="text"
                      :value="item.预计完成"
                      @input="update({ 预计完成: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row full">
                    <label>关联人物</label>
                    <ArrayEditor
                      :model-value="item.关联人物 || []"
                      :suggestions="人物名单"
                      @update:model-value="update({ 关联人物: $event })"
                    />
                  </div>
                </div>
              </div>
            </template>
          </RecordTable>
        </div>

        <!-- 表彰记录 -->
        <div class="sub-section">
          <h5><i class="fas fa-medal"></i> 表彰记录</h5>
          <RecordTable
            v-model="data.个人档案.表彰记录"
            :meta-fields="['名称', '授予单位']"
            add-text="新增表彰"
            @add="addRecord('个人档案.表彰记录', '表彰')"
          >
            <template #item="{ item, update }">
              <div class="record-editor">
                <div class="field-grid">
                  <div class="field-row">
                    <label>名称</label>
                    <input
                      type="text"
                      :value="item.名称"
                      @input="update({ 名称: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>授予单位</label>
                    <input
                      type="text"
                      :value="item.授予单位"
                      @input="update({ 授予单位: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>时间</label>
                    <input
                      type="text"
                      :value="item.时间"
                      @input="update({ 时间: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                </div>
              </div>
            </template>
          </RecordTable>
        </div>

        <!-- 处分记录 -->
        <div class="sub-section">
          <h5><i class="fas fa-gavel"></i> 处分记录</h5>
          <RecordTable
            v-model="data.个人档案.处分记录"
            :meta-fields="['处分类型', '处分原因']"
            add-text="新增处分"
            @add="addRecord('个人档案.处分记录', '处分')"
          >
            <template #item="{ item, update }">
              <div class="record-editor">
                <div class="field-grid">
                  <div class="field-row">
                    <label>处分类型</label>
                    <input
                      type="text"
                      :value="item.处分类型"
                      @input="update({ 处分类型: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>处分原因</label>
                    <input
                      type="text"
                      :value="item.处分原因"
                      @input="update({ 处分原因: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>处分时间</label>
                    <input
                      type="text"
                      :value="item.处分时间"
                      @input="update({ 处分时间: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                  <div class="field-row">
                    <label>影响期限</label>
                    <input
                      type="text"
                      :value="item.影响期限"
                      @input="update({ 影响期限: ($event.target as HTMLInputElement).value })"
                    />
                  </div>
                </div>
              </div>
            </template>
          </RecordTable>
        </div>
      </SectionAccordion>

      <!-- 派系图谱 -->
      <SectionAccordion
        v-show="sectionVisible.派系图谱"
        ref="section派系图谱"
        title="派系图谱"
        icon="fas fa-sitemap"
        :expanded="expanded.派系图谱"
        :filled-count="countFilled(data.派系图谱)"
        :total-count="countTotal(data.派系图谱)"
        :dirty="sectionDirty.派系图谱"
        @toggle="expanded.派系图谱 = $event"
        @save="saveSection('派系图谱')"
      >
        <!-- 我方派系 -->
        <div class="sub-section">
          <h5><i class="fas fa-flag"></i> 我方派系</h5>
          <div class="field-group">
            <div class="field-row">
              <label>派系名称</label>
              <input v-model="data.派系图谱.我方派系.派系名称" type="text" />
            </div>
            <div class="field-row">
              <label>核心人物</label>
              <input v-model="data.派系图谱.我方派系.核心人物" type="text" />
            </div>
            <div class="field-row full">
              <label>势力范围</label>
              <textarea v-model="data.派系图谱.我方派系.势力范围" rows="2"></textarea>
            </div>
            <div class="field-row">
              <label>实力评估</label>
              <input v-model="data.派系图谱.我方派系.实力评估" type="text" />
            </div>
            <div class="field-row full">
              <label>近期动向</label>
              <textarea v-model="data.派系图谱.我方派系.近期动向" rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- 主要派系 -->
        <div class="sub-section">
          <h5><i class="fas fa-users-cog"></i> 主要派系</h5>
          <RecordTable
            v-model="data.派系图谱.主要派系"
            :meta-fields="['派系名称', '核心人物']"
            add-text="新增派系"
            @add="addRecord('派系图谱.主要派系', '派系')"
          />
        </div>
      </SectionAccordion>

      <!-- 绯色履历 -->
      <SectionAccordion
        v-show="sectionVisible.绯色履历"
        ref="section绯色履历"
        title="绯色履历"
        icon="fas fa-heart"
        :expanded="expanded.绯色履历"
        :show-count="false"
        :dirty="sectionDirty.绯色履历"
        @toggle="expanded.绯色履历 = $event"
        @save="saveSection('绯色履历')"
      >
        <template #meta>
          <span class="field-count romance">{{ Object.keys(data.绯色履历).length }} 段</span>
        </template>
        <RecordTable
          v-model="data.绯色履历"
          :meta-fields="['对象', '关系性质']"
          add-text="新增履历"
          @add="addRecord('绯色履历', '绯色履历')"
        />
      </SectionAccordion>

      <!-- 个人资产 -->
      <SectionAccordion
        v-show="sectionVisible.个人资产"
        ref="section个人资产"
        title="个人资产"
        icon="fas fa-coins"
        :expanded="expanded.个人资产"
        :filled-count="countFilled(data.个人资产)"
        :total-count="countTotal(data.个人资产)"
        :dirty="sectionDirty.个人资产"
        @toggle="expanded.个人资产 = $event"
        @save="saveSection('个人资产')"
      >
        <div class="field-group">
          <div class="field-row">
            <label>申报资产 (万元)</label>
            <input v-model.number="data.个人资产.申报资产" type="number" min="0" />
          </div>
          <div class="field-row">
            <label>实际资产 (万元)</label>
            <input v-model.number="data.个人资产.实际资产" type="number" min="0" />
          </div>
          <div class="field-row">
            <label>灰色资产 (万元)</label>
            <input v-model.number="data.个人资产.灰色资产" type="number" min="0" />
          </div>
          <div class="field-row">
            <label>现居住地</label>
            <input v-model="data.个人资产.现居住地" type="text" />
          </div>
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-home"></i> 房产</h5>
          <RecordTable
            v-model="data.个人资产.房产"
            :meta-fields="['位置', '估值']"
            add-text="新增房产"
            @add="addRecord('个人资产.房产', '房产')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-car"></i> 座驾</h5>
          <RecordTable
            v-model="data.个人资产.座驾"
            :meta-fields="['品牌型号', '来源']"
            add-text="新增座驾"
            @add="addRecord('个人资产.座驾', '座驾')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-mask"></i> 白手套</h5>
          <RecordTable
            v-model="data.个人资产.白手套"
            :meta-fields="['人物ID', '代持金额']"
            add-text="新增白手套"
            @add="addRecord('个人资产.白手套', '白手套')"
          />
        </div>
      </SectionAccordion>

      <!-- 暗账 -->
      <SectionAccordion
        v-show="sectionVisible.暗账"
        ref="section暗账"
        title="暗账"
        icon="fas fa-user-secret"
        :expanded="expanded.暗账"
        :filled-count="countFilled(data.暗账)"
        :total-count="countTotal(data.暗账)"
        :dirty="sectionDirty.暗账"
        @toggle="expanded.暗账 = $event"
        @save="saveSection('暗账')"
      >
        <div class="sub-section">
          <h5><i class="fas fa-bomb"></i> 被握把柄</h5>
          <RecordTable
            v-model="data.暗账.被握把柄"
            :meta-fields="['把柄内容', '掌握者']"
            add-text="新增把柄"
            @add="addRecord('暗账.被握把柄', '被握把柄')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-hand-fist"></i> 手握把柄</h5>
          <RecordTable
            v-model="data.暗账.手握把柄"
            :meta-fields="['把柄内容', '目标人物']"
            add-text="新增把柄"
            @add="addRecord('暗账.手握把柄', '手握把柄')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-land-mine-on"></i> 政治地雷</h5>
          <RecordTable
            v-model="data.暗账.政治地雷"
            :meta-fields="['内容', '杀伤力']"
            add-text="新增地雷"
            @add="addRecord('暗账.政治地雷', '政治地雷')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-handshake-angle"></i> 人情债</h5>
          <RecordTable
            v-model="data.暗账.人情债"
            :meta-fields="['债主', '欠债内容']"
            add-text="新增人情债"
            @add="addRecord('暗账.人情债', '人情债')"
          />
        </div>
      </SectionAccordion>

      <!-- 机遇与危机 -->
      <SectionAccordion
        v-show="sectionVisible.机遇与危机"
        ref="section机遇与危机"
        title="机遇与危机"
        icon="fas fa-scale-balanced"
        :expanded="expanded.机遇与危机"
        :filled-count="countFilled(data.机遇与危机)"
        :total-count="countTotal(data.机遇与危机)"
        :dirty="sectionDirty.机遇与危机"
        @toggle="expanded.机遇与危机 = $event"
        @save="saveSection('机遇与危机')"
      >
        <div class="sub-section">
          <h5><i class="fas fa-sun"></i> 当前机遇</h5>
          <RecordTable
            v-model="data.机遇与危机.当前机遇"
            :meta-fields="['机遇名称', '机遇等级']"
            add-text="新增机遇"
            @add="addRecord('机遇与危机.当前机遇', '机遇')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-cloud-bolt"></i> 潜在危机</h5>
          <RecordTable
            v-model="data.机遇与危机.潜在危机"
            :meta-fields="['危机名称', '危机等级']"
            add-text="新增危机"
            @add="addRecord('机遇与危机.潜在危机', '危机')"
          />
        </div>

        <div class="sub-section">
          <h5><i class="fas fa-list-check"></i> 待办事项</h5>
          <RecordTable
            v-model="data.机遇与危机.待办事项"
            :meta-fields="['事项', '紧急程度']"
            add-text="新增待办"
            @add="addRecord('机遇与危机.待办事项', '待办事项')"
          />
        </div>
      </SectionAccordion>
    </div>

    <!-- 导入弹窗 -->
    <Modal v-model="showImportModal" title="导入数据" icon="fas fa-upload" size="md">
      <div class="import-content">
        <p class="import-hint">选择 JSON 文件导入，将覆盖当前数据</p>
        <div
          class="import-dropzone"
          :class="{ dragover: isDragover }"
          @dragover.prevent="isDragover = true"
          @dragleave="isDragover = false"
          @drop.prevent="handleFileDrop"
        >
          <i class="fas fa-cloud-upload-alt"></i>
          <p>拖拽文件到此处，或</p>
          <label class="upload-btn">
            <span>选择文件</span>
            <input type="file" accept=".json" hidden @change="handleFileSelect" />
          </label>
        </div>
        <div v-if="importPreview" class="import-preview">
          <h5>预览</h5>
          <pre>{{ JSON.stringify(importPreview, null, 2).slice(0, 500) }}...</pre>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showImportModal = false">取消</button>
        <button class="btn-primary" :disabled="!importPreview" @click="confirmImport">
          <i class="fas fa-check"></i> 确认导入
        </button>
      </template>
    </Modal>

    <!-- 清除缓存确认弹窗 -->
    <Modal v-model="showClearCacheConfirm" title="确认清除" size="sm">
      <div class="clear-cache-confirm">
        <i class="fas fa-exclamation-triangle warning-icon"></i>
        <p>确定要清除所有上传的头像缓存吗？</p>
        <p class="hint">此操作将删除所有角色头像和绯色封面图片，且不可恢复。</p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showClearCacheConfirm = false">取消</button>
        <button class="btn-danger" @click="confirmClearCache"><i class="fas fa-trash-alt"></i> 确认清除</button>
      </template>
    </Modal>

    <!-- 确认当前开局弹窗 -->
    <ConfirmDialog
      v-model="showStartupConfirm"
      title="确认当前开局"
      message="确定使用当前变量开始游戏吗？系统将根据当前全局变量快照生成开局剧情。"
      confirm-text="开始游戏"
      cancel-text="继续编辑"
      type="primary"
      @confirm="confirmStartup"
    />
  </div>
</template>

<script setup lang="ts">
import { klona } from 'klona';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrayEditor, Modal, SliderField } from '../components/common';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import { RecordTable, SectionAccordion } from '../components/variable';
import { useCharacters, useGameData, useLocalCache, useMvuSettings } from '../stores';
import type { GameData } from '../stores/schema';

const gameData = useGameData();
const characters = useCharacters();
const localCache = useLocalCache();
const mvuSettings = useMvuSettings();

// 开局模式检测
const isStartupMode = computed(() => gameData.isStartupMode);

// 确认当前开局弹窗
const showStartupConfirm = ref(false);

async function confirmStartup() {
  showStartupConfirm.value = false;
  await mvuSettings.confirmStartup();
}

// 页面加载时清除跳转标志（确认更新后跳转到此页面）
onMounted(() => {
  const api = (window.parent as any)?.ScarletMvu;
  if (api?.getShouldNavigateToVariables?.()) {
    console.info('[绯色官途] Variables 页面加载，清除跳转标志');
    api.clearNavigateFlag();
  }
});

// 本地编辑副本
const data = reactive(klona(gameData.rawData));

// 人物名单（用于建议）
const 人物名单 = computed(() => characters.人物名单);

// 同步原始数据变化
watch(
  () => gameData.rawData,
  newData => {
    if (!gameData.isDirty) {
      Object.assign(data, klona(newData));
    }
  },
  { deep: true },
);

// 搜索和过滤
const searchQuery = ref('');
const onlyFilled = ref(false);

// 搜索匹配函数 - 递归搜索对象中的所有字段
function matchesSearch(obj: unknown, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();

  if (typeof obj === 'string') {
    return obj.toLowerCase().includes(q);
  }
  if (typeof obj === 'number') {
    return String(obj).includes(q);
  }
  if (Array.isArray(obj)) {
    return obj.some(item => matchesSearch(item, query));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).some(([key, value]) => key.toLowerCase().includes(q) || matchesSearch(value, query));
  }
  return false;
}

// 判断对象是否有已填写的内容
function hasFilledContent(obj: unknown): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'string') return obj !== '无' && obj !== '';
  if (typeof obj === 'number') return obj > 0;
  if (typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.length > 0;
  if (typeof obj === 'object') {
    return Object.values(obj).some(v => hasFilledContent(v));
  }
  return false;
}

// 分区可见性 - 结合搜索和筛选条件
const sectionVisible = computed(() => {
  const sections = [
    '时空舆情',
    '当前场景',
    '关系索引',
    '人物库',
    '个人档案',
    '派系图谱',
    '绯色履历',
    '个人资产',
    '暗账',
    '机遇与危机',
  ] as const;

  return sections.reduce(
    (acc, section) => {
      const sectionData = data[section];
      const matchSearch = matchesSearch(section, searchQuery.value) || matchesSearch(sectionData, searchQuery.value);
      const matchFilled = !onlyFilled.value || hasFilledContent(sectionData);
      acc[section] = matchSearch && matchFilled;
      return acc;
    },
    {} as Record<string, boolean>,
  );
});

// 展开状态
const expanded = reactive<Record<string, boolean>>({
  时空舆情: true,
  当前场景: false,
  关系索引: false,
  人物库: false,
  个人档案: false,
  派系图谱: false,
  绯色履历: false,
  个人资产: false,
  暗账: false,
  机遇与危机: false,
});

// 分区脏数据标记
const sectionDirty = computed(() => {
  const original = gameData.rawData;
  return {
    时空舆情: JSON.stringify(data.时空舆情) !== JSON.stringify(original.时空舆情),
    当前场景: JSON.stringify(data.当前场景) !== JSON.stringify(original.当前场景),
    关系索引: JSON.stringify(data.关系索引) !== JSON.stringify(original.关系索引),
    人物库: JSON.stringify(data.人物库) !== JSON.stringify(original.人物库),
    个人档案: JSON.stringify(data.个人档案) !== JSON.stringify(original.个人档案),
    派系图谱: JSON.stringify(data.派系图谱) !== JSON.stringify(original.派系图谱),
    绯色履历: JSON.stringify(data.绯色履历) !== JSON.stringify(original.绯色履历),
    个人资产: JSON.stringify(data.个人资产) !== JSON.stringify(original.个人资产),
    暗账: JSON.stringify(data.暗账) !== JSON.stringify(original.暗账),
    机遇与危机: JSON.stringify(data.机遇与危机) !== JSON.stringify(original.机遇与危机),
  };
});

// 总体脏数据标记
const isDirty = computed(() => Object.values(sectionDirty.value).some(v => v));

const weekdays = ['无', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// ═══ 方法 ═══

function expandAll() {
  Object.keys(expanded).forEach(k => (expanded[k] = true));
}

function collapseAll() {
  Object.keys(expanded).forEach(k => (expanded[k] = false));
}

function countFilled(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return obj && obj !== '无' ? 1 : 0;
  return Object.values(obj).reduce((acc: number, v) => acc + countFilled(v), 0);
}

function countTotal(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 1;
  return Object.values(obj).reduce((acc: number, v) => acc + countTotal(v), 0);
}

function addCharacter() {
  const name = prompt('请输入新人物姓名：');
  if (!name) return;
  if (data.人物库[name]) {
    toastr.warning('人物已存在');
    return;
  }
  data.人物库[name] = {
    姓名: name,
    性别: '无',
    年龄: 0,
    体系: '无',
    级别: '无',
    职务: '无',
    单位: '无',
    派系: '无',
    状态: '无',
    婚姻状态: '无',
    好感度: 50,
    信任度: 50,
    忠诚度: 0,
    当前状态: '无',
    角色标签: [],
  };
  toastr.success(`人物「${name}」已添加`);
}

// 各种 Record 类型的默认字段结构
const recordTemplates: Record<string, Record<string, any>> = {
  '个人档案.任职履历': {
    职务名称: '无',
    单位: '无',
    体系: '无',
    级别: '无',
    起始年月: '无',
    结束年月: '无',
    主要政绩: '无',
    离任原因: '无',
  },
  '个人档案.在手项目': {
    项目名称: '无',
    角色定位: '无',
    进展状态: '无',
    政治效益: '无',
    风险等级: '无',
    预计完成: '无',
    关联人物: [],
  },
  '个人档案.表彰记录': {
    名称: '无',
    授予单位: '无',
    时间: '无',
  },
  '个人档案.处分记录': {
    处分类型: '无',
    处分原因: '无',
    处分时间: '无',
    影响期限: '无',
  },
  '个人档案.现任职务.兼任职务': {
    职务名称: '无',
  },
  '个人档案.现任职务.分管领域': {
    领域名称: '无',
  },
  '派系图谱.主要派系': {
    派系名称: '无',
    核心人物: '无',
    势力范围: '无',
    实力评估: '无',
    与我派系关系: '无',
    近期动向: '无',
  },
  绯色履历: {
    对象: '无',
    起始时间: '无',
    结束时间: '无',
    关系性质: '无',
    结局: '无',
    遗留问题: '无',
  },
  '个人资产.房产': {
    位置: '无',
    面积: '无',
    估值: 0,
    来源: '无',
    登记人: '无',
  },
  '个人资产.座驾': {
    品牌型号: '无',
    来源: '无',
  },
  '个人资产.白手套': {
    人物ID: '无',
    代持内容: '无',
    代持金额: 0,
    可靠程度: '无',
  },
  '暗账.被握把柄': {
    把柄内容: '无',
    把柄类型: '无',
    掌握者: '无',
    致命程度: '无',
    暴露风险: '无',
    当前状态: '无',
  },
  '暗账.手握把柄': {
    把柄内容: '无',
    目标人物: '无',
    致命程度: '无',
    可用性: '无',
  },
  '暗账.政治地雷': {
    内容: '无',
    性质: '无',
    来源: '无',
    引爆条件: '无',
    杀伤力: '无',
  },
  '暗账.人情债': {
    债主: '无',
    欠债内容: '无',
    债务性质: '无',
    偿还压力: '无',
    已偿还: false,
  },
  '机遇与危机.当前机遇': {
    机遇名称: '无',
    机遇内容: '无',
    机遇等级: '无',
    来源渠道: '无',
    时效性: '无',
    所需资源: '无',
    潜在代价: '无',
  },
  '机遇与危机.潜在危机': {
    危机名称: '无',
    危机内容: '无',
    危机等级: '无',
    危机来源: '无',
    引爆概率: '无',
    应对思路: '无',
  },
  '机遇与危机.待办事项': {
    事项: '无',
    紧急程度: '无',
    截止时间: '无',
    关联人物: [],
  },
};

function addRecord(path: string, type: string) {
  const name = prompt(`请输入新${type}名称：`);
  if (!name) return;
  const parts = path.split('.');
  let target: any = data;
  for (const part of parts) {
    target = target[part];
  }
  if (target[name]) {
    toastr.warning(`${type}「${name}」已存在`);
    return;
  }
  // 使用模板初始化字段，如果没有对应模板则使用空对象
  const template = recordTemplates[path] || {};
  target[name] = klona(template);
  toastr.success(`${type}「${name}」已添加`);
}

async function saveSection(section: keyof GameData) {
  try {
    await gameData.saveData({ [section]: klona(data[section]) } as Partial<GameData>);
    toastr.success(`${section} 已保存`);
  } catch (e) {
    toastr.error('保存失败');
  }
}

async function saveAll() {
  try {
    await gameData.saveData(klona(data) as GameData);
    toastr.success('全部保存成功');
  } catch (e) {
    toastr.error('保存失败');
  }
}

// ═══ 导入导出 ═══

const showImportModal = ref(false);
const isDragover = ref(false);
const importPreview = ref<unknown>(null);

function handleExport() {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `绯色官途_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success('导出成功');
}

function handleFileDrop(e: DragEvent) {
  isDragover.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) {
    parseImportFile(file);
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    parseImportFile(file);
  }
}

function parseImportFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string);
      importPreview.value = parsed;
    } catch (err) {
      toastr.error('文件解析失败，请确保是有效的 JSON 文件');
      importPreview.value = null;
    }
  };
  reader.readAsText(file);
}

async function confirmImport() {
  if (!importPreview.value) return;
  try {
    Object.assign(data, klona(importPreview.value));
    await gameData.saveData(klona(data) as GameData);
    toastr.success('导入成功');
    showImportModal.value = false;
    importPreview.value = null;
  } catch (err) {
    toastr.error('导入失败');
  }
}

// ═══ 清除缓存 ═══

const showClearCacheConfirm = ref(false);

function confirmClearCache() {
  localCache.clearAllAvatars();
  showClearCacheConfirm.value = false;
  toastr.success('头像缓存已清除');
}
</script>

<style lang="scss" scoped>
.variables-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

// ═══ 工具栏 ═══
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: center;
  justify-content: space-between;
}

.search-box {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  i {
    color: var(--color-text-muted);
  }

  input {
    flex: 1;
    color: var(--color-text-primary);

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  align-items: center;
}

.toggle-filled {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
  cursor: pointer;

  input {
    accent-color: var(--color-gold);
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }

  &.danger {
    border-color: rgba(220, 53, 69, 0.5);
    color: var(--color-danger);

    &:hover {
      background: rgba(220, 53, 69, 0.1);
      border-color: var(--color-danger);
    }
  }
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
}

.startup-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-romance) 0%, var(--color-romance-dark) 100%);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  transition: all var(--transition-fast);

  i {
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }
}

// ═══ 分区列表 ═══
.sections-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

// ═══ 空搜索结果 ═══
.empty-search-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: 48px;
  color: var(--color-text-muted);
  text-align: center;

  i {
    font-size: 48px;
    opacity: 0.5;
  }

  p {
    font-size: 14px;
  }
}

// ═══ 字段组 ═══
.field-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full {
    grid-column: 1 / -1;
  }

  label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type='text'],
  input[type='number'],
  textarea,
  select {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 13px;

    &:focus {
      border-color: var(--color-gold);
      outline: none;
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .computed-value {
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    font-size: 13px;
    color: var(--color-gold);
  }
}

// ═══ 子区块 ═══
.sub-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }

  h5 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-md);

    i {
      color: var(--color-gold);
    }
  }
}

// ═══ 嵌套区块 ═══
.nested-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);

  h6 {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0 0 var(--spacing-sm);

    i {
      color: var(--color-gold);
      font-size: 10px;
    }
  }
}

// ═══ 记录编辑器 ═══
.record-editor {
  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-sm);

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }
}

// ═══ 数值网格 ═══
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md) var(--spacing-lg);

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

// ═══ 字段计数 ═══
.field-count {
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 2px 8px;
  background: var(--color-bg-elevated);
  border-radius: var(--radius-sm);

  &.romance {
    background: rgba(255, 77, 109, 0.15);
    color: var(--color-romance-light);
  }
}

// ═══ 导入弹窗 ═══
.import-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.import-hint {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
}

.import-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xl);
  background: var(--color-bg-elevated);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);

  &.dragover {
    border-color: var(--color-gold);
    background: rgba(216, 166, 87, 0.1);
  }

  i {
    font-size: 32px;
    color: var(--color-text-muted);
  }

  p {
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .upload-btn {
    padding: var(--spacing-sm) var(--spacing-lg);
    background: var(--color-gold);
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 600;
    color: var(--color-bg-dark);
    cursor: pointer;

    &:hover {
      filter: brightness(1.1);
    }
  }
}

.import-preview {
  h5 {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xs);
  }

  pre {
    padding: var(--spacing-sm);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-md);
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
    max-height: 150px;
    overflow: auto;
  }
}

// ═══ 按钮样式 ═══
.btn-secondary {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--color-text-secondary);

  &:hover {
    background: var(--color-bg-elevated);
    color: var(--color-text-primary);
  }
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-gold);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-bg-dark);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-danger);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: white;

  &:hover {
    filter: brightness(1.1);
  }
}

// ═══ 清除缓存确认弹窗 ═══
.clear-cache-confirm {
  text-align: center;
  padding: var(--spacing-lg);

  .warning-icon {
    font-size: 48px;
    color: var(--color-warning);
    margin-bottom: var(--spacing-md);
  }

  p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-primary);

    &.hint {
      margin-top: var(--spacing-sm);
      font-size: 12px;
      color: var(--color-text-muted);
    }
  }
}
</style>
