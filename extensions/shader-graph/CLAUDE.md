[根目录](../../CLAUDE.md) > [extensions](../) > **shader-graph**

# Shader Graph 扩展模块

## 变更记录 (Changelog)

### 2025-09-14 - 深度分析核心实现
- 完成 `src/shader-graph/` 核心着色器图逻辑深度分析
- 详解管理器架构和节点系统设计
- 深入解析着色器编译和代码生成机制
- 补充 block-forge 图形编辑器实现细节

### 2025-09-14 - 模块文档初始化
- 分析 shader-graph 扩展架构
- 记录核心功能和接口定义
- 建立开发和调试指南

---

## 模块职责

Shader Graph 是一个可视化着色器编辑器扩展，为 Cocos Creator 提供直观的节点式着色器创建工具。

### 核心功能
- **可视化编辑**：拖拽节点创建复杂着色器逻辑
- **实时预览**：即时查看着色器效果
- **节点系统**：丰富的内置节点库（数学、纹理、逻辑等）
- **主节点类型**：支持 Surface 和 Unlit 主节点
- **资产集成**：与 Cocos Creator 资产系统深度整合

## 核心架构分析

### 🏗️ 模块化管理器架构

#### 基础管理器 (`src/shader-graph/base/`)
核心采用单例模式的管理器架构，所有管理器继承自 `BaseMgr` 基类：

```typescript
// BaseMgr - 管理器基类 (base-mgr.ts:5-40)
export class BaseMgr extends EventEmitter {
    protected _graphForge: HTMLGraphForgeElement | null = null;

    public setGraphForge(forge: HTMLGraphForgeElement) {
        this._graphForge = forge;
    }

    public getRootGraphData(): GraphData {
        return this.graphForge.rootGraph!;
    }

    public getCurrentGraphData(): GraphData {
        const currentGraphData: GraphData = this.graphForge.getCurrentGraph();
        // 自动初始化 properties 数组
        if (currentGraphData) {
            if (!currentGraphData.details) {
                currentGraphData.details = {};
            }
            if (!Array.isArray(currentGraphData.details.properties)) {
                currentGraphData.details.properties = [];
            }
        }
        return currentGraphData;
    }
}
```

#### 专业化管理器体系
1. **GraphEditorMgr** - 图形编辑操作管理器
   - 负责节点的增删改查操作 (graph-editor-mgr.ts:18)
   - 实现剪贴板操作（复制、粘贴、剪切）
   - 支持撤销/重做机制和鼠标位置追踪

2. **GraphDataMgr** - 数据管理与持久化
   - 处理着色器图数据的序列化/反序列化 (graph-data-mgr.ts:18)
   - 使用 js-yaml 进行数据存储，支持热重载
   - 实现脏数据标记和自动保存机制

3. **ForgeMgr** - 图形操作封装管理器
   - 对底层 block-forge 系统的二次封装 (forge-mgr.ts:7)
   - 提供统一的节点和图形访问接口

4. **MaskMgr** - UI 遮罩管理器
   - 管理编辑器界面的遮罩层显示

5. **MessageMgr** - 消息通信中心
   - 实现模块间的解耦通信机制

6. **GraphPropertyMgr** - 着色器属性管理器
   - 管理着色器的输入属性和参数

7. **GraphAssetMgr** - 资产集成管理器
   - 处理与 Cocos Creator 资产系统的集成

8. **GraphConfigMgr** - 配置管理器
   - 管理编辑器的配置状态和持久化

### 🎯 节点系统设计

#### 节点声明与注册机制 (`src/shader-graph/declare/`)
采用声明式的节点定义系统：

```typescript
// 节点模板创建 (declare/block.ts:62-93)
function createBlockByNodeDefine(nodeDefine: NodeDefine) {
    const description: IBlockDescription = {
        type: nodeDefine.type,
        title: nodeDefine.details?.title || '',
        inputPins: [],
        outputPins: [],
        style: {
            headerColor: '#227F9B80', // 节点头部默认颜色
        },
    };

    // 样式合并机制
    if (nodeDefine.details?.style !== undefined) {
        description.style = { ...description.style, ...nodeDefine.details?.style };
    }
}

// Pin 连接创建机制 (declare/block.ts:14-60)
function createPin(blockType: string, slotTag: SlotTag, slot: SlotDefine, details?: { [key: string]: any }) {
    const tag = createPinTag(blockType, slotTag, slot);
    const pinDescription: IPinDescription = {
        tag: tag,
        dataType: slot.type,
        value: slot.default,
        name: slot.display,
        hidePin: slotTag === 'prop', // 属性槽默认隐藏
        details: {},
    };

    // 枚举类型处理
    if (slot.type === 'enum' && slot.enum) {
        const type = slot.enum._name || `${blockType}_${slot.display}`;
        declareEnum(type, slot.enum);
        pinDescription.details.type = type;
    }

    // 连接类型判断 - 用于验证节点间连接的合法性
    if ('connectType' in slot) {
        pinDescription.details.connectType = slot.connectType;
    }
}
```

#### 图形编辑核心逻辑

**智能节点操作** (graph-editor-mgr.ts:61-90):
```typescript
public add(options: GraphEditorAddOptions) {
    const blockTemplate = getBlockTemplateByType(options.type);
    const data = blockTemplate && blockTemplate.data;

    // 自动补全输入输出槽
    if (!options.details.outputPins || options.details.outputPins.length === 0) {
        options.details.outputPins = data.details.outputPins || [];
    }
    if (!options.details.inputPins || options.details.inputPins.length === 0) {
        options.details.inputPins = data.details.inputPins || [];
    }

    // 智能位置计算 - 支持鼠标位置和坐标转换
    let position = { x: options.x || 0, y: options.y || 0 };
    if (options.x === undefined && options.y === undefined) {
        position = this.graphForge.convertCoordinate(this.mousePointInPanel);
    }
}
```

**高级剪贴板操作** (graph-editor-mgr.ts:185-264):
- 支持跨图复制粘贴
- 自动重新映射 UUID 避免冲突
- 智能连线重建算法（500ms 延迟确保节点就绪）

### 🎨 Block-Forge 图形编辑器

#### HTMLGraphForgeElement - 核心 Web Component
这是整个图形编辑器的核心自定义元素 (block-forge/forge.ts:56):

```typescript
export class HTMLGraphForgeElement extends HTMLElement {
    // 操作队列 - 支持撤销/重做
    private actionQueue = new ActionQueue({
        forge: this,
    });

    $graph: GraphElement; // ui-graph 底层图形元素
    rootGraph?: GraphData; // 根图数据
    paths: GraphData[] = []; // 当前图形路径（支持子图导航）

    // 坐标转换系统 - 屏幕坐标到图形坐标
    convertCoordinate(point: { x: number, y: number }) {
        point = this.$graph.convertCoordinate(point.x, point.y);
        return point;
    }

    // 序列化/反序列化 - 使用 YAML 格式
    deserialize(content: string): GraphData {
        const graphData = yaml.load(content) as GraphData;
        return graphData;
    }

    serialize(data?: GraphData): string {
        const str = yaml.dump(data || this.paths[0]);
        return str;
    }
}
```

#### 事件驱动的交互系统
完整的鼠标和键盘事件处理机制 (block-forge/forge.ts:109-430)：
- 节点点击/双击/右键菜单
- 连线创建/删除/选择
- 图形区域右键菜单
- 拖拽和缩放操作

### 🔧 着色器编译系统

#### 智能代码生成引擎 (`shader-node/compile-shader/scripts/`)

**GLSL 函数解析器** (compile-shader/scripts/generate.js:37-75):
```javascript
// 正则表达式解析 GLSL 函数定义
const reg = /^(\s*)(vec4|vec3|vec2|float|int|void) *(\w*) *\((.*)\) *{([\s\S]*?^\1)}\s*$/gm;

function fetchFuncs(content) {
    const funcRegs = content.match(reg);

    funcRegs.forEach(funcReg => {
        const func = {
            return: res[2],     // 返回类型
            name: res[3],       // 函数名
            body: res[5],       // 函数体
            inputs: [],         // 输入参数
            outputs: []         // 输出参数
        };

        // 解析参数列表
        const inputs = res[4].split(',');
        func.inputs = inputs.map((i, idx) => {
            const res = /(\w+) +(\w+)/.exec(i);
            return { type: res[1], name: res[2] };
        });
    });
}
```

**注释驱动的节点配置** (compile-shader/scripts/generate.js:90-152):
支持通过特殊注释自动生成节点：
```glsl
/**
 * @param uv notConnect=v_uv.xy  // 默认值配置
 * @param width default=0.5      // 默认参数
 * @presicion fixed              // 精度设置
 * @inline                       // 内联标记
 * @folder math/basic            // 菜单分类
 */
vec4 Add(vec4 A, vec4 B) {
    return A + B;
}
```

**TypeScript 节点类生成** (compile-shader/scripts/generate.js:155-314):
自动生成完整的 TypeScript 节点类：
```typescript
// 生成的节点类模板
@register({
    menu: '${folder}/${func.name}',
    title: '${func.name}',
})
export default class ${func.name} extends ShaderNode {
    concretePrecisionType = ConcretePrecisionType.${makeFirstCharUppcase(func.params.presicion)};

    data = {
        inputs: [${inputsDatas}],
        outputs: [${outputsDatas}],
    };

    generateCode() {
        ${inputs}  // 输入值获取
        ${outputs} // 输出变量定义
        return \`${funcCode}\`; // 生成的 GLSL 代码
    }
}
```

#### 着色器模板系统
**主节点模板** (shader-templates/master/SurfaceMasterNode.effect):
- 支持多通道渲染（opaque、transparent、shadow-caster 等）
- 模板变量替换系统 (`{{properties}}`, `{{chunks}}`, `{{code_chunk_0}}`)
- PBR 材质属性槽映射 (`{{slot_Albedo}}`, `{{slot_Metallic}}` 等)

### 🔗 数据流与连接验证

#### 智能连接验证 (`declare/graph.ts:21-49`)
```typescript
validator: {
    dataLink(nodes, lines, line, input, output): boolean {
        // 获取输入输出节点的连接类型
        const inputConnectType = getConnectType(inputBlock, input);
        const outputConnectType = getConnectType(outputBlock, output);

        // 删除重复输出连接 - 确保一个输出只连接一个输入
        GraphEditorMgr.Instance.deleteLinesByDuplicateOutput(lines, line);

        // 连接合法性验证
        return (inputConnectType === outputConnectType) || (input.type === output.type);
    }
}
```

#### 属性节点特殊处理
PropertyNode 支持动态类型推断和连接类型切换

## 入口与启动

### 主入口文件
- **主进程**：`src/main.ts` - 扩展主进程逻辑
- **面板入口**：`src/panels/shader-graph/index.ts` - 编辑器面板
- **钩子脚本**：`src/hooks.ts` - 扩展生命周期钩子

### 启动流程
1. 扩展加载时注册资产处理器和菜单项
2. 通过菜单或双击 `.shadergraph` 文件打开编辑器面板
3. 初始化图形编辑器和节点系统
4. 建立预览场景和着色器编译管道

## 对外接口

### 消息接口
```typescript
// 核心消息处理
"open": 打开着色器图
"open-asset": 打开指定资产
"save": 保存当前着色器
"popup-create-menu": 显示创建节点菜单

// 编辑操作
"copy", "cut", "paste": 剪贴板操作
"delete": 删除选中节点
"undo", "redo": 撤销重做
"duplicate": 复制节点
```

### 资产处理
- **文件类型**：`.shadergraph`
- **导入器**：`registerShaderGraphImporter`
- **版本兼容**：支持 3.8+ 版本兼容性处理

### 快捷键
- `Space`: 弹出创建菜单
- `Ctrl/Cmd + S`: 保存
- `Ctrl/Cmd + C/V/X`: 复制粘贴剪切
- `Ctrl/Cmd + Z/Shift+Z`: 撤销重做
- `Ctrl/Cmd + G`: 创建组节点

## 关键依赖与配置

### 主要依赖
```json
{
  "@cocos/creator-types": "^3.8.1",
  "@itharbors/ui-graph": "^0.3.2",
  "vue": "2.7.14",
  "lodash": "^4.17.21",
  "js-yaml": "^4.1.0",
  "semver": "^7.5.4"
}
```

### 构建配置
- **TypeScript**：`tsconfig.json`
- **Less 样式**：`static/shader-graph/*.less`
- **构建脚本**：`npm run build` (TypeScript + Less)

### 编辑器配置
- **最低版本**：Cocos Creator 3.8.2+
- **面板配置**：可停靠，最小尺寸 400x300，默认 1024x600
- **资产挂载**：只读挂载 `shader-node/assets`

## 数据模型与实现细节

### 🧩 着色器节点基类系统 (`shader-node/assets/operation/base.ts`)

#### ShaderNode 基类架构
```typescript
// ShaderNode - 所有着色器节点的基类 (base.ts:24-174)
export class ShaderNode {
    priority = 0;                              // 节点优先级（用于编译顺序）
    uuid = '';                                 // 节点唯一标识
    slots: ShaderSlot[] = [];                  // 所有输入输出槽

    concretePrecisionType = ConcretePrecisionType.Min;  // 精度计算类型
    fixedConcretePrecision = 0;                        // 固定精度值

    inputs: ShaderSlot[] = [];                 // 输入槽数组
    outputs: ShaderSlot[] = [];                // 输出槽数组
    props: Map<string, ShaderNodeProp> = new Map; // 属性映射

    // 依赖计算 - 基于输入连接动态计算
    get deps() {
        const deps: ShaderNode[] = [];
        this.inputs.forEach(i => {
            if (i.connectSlot) {
                deps.push(i.connectSlot.node);
            }
        });
        return deps;
    }

    // 精度传播算法 - 支持 Min/Max/Fixed/Texture 四种模式
    calcConcretePrecision() {
        if (this.concretePrecisionType !== ConcretePrecisionType.Fixed) {
            let finalPrecision = 1;
            if (this.concretePrecisionType === ConcretePrecisionType.Min) {
                finalPrecision = 999;
                this.inputs.forEach(slot => {
                    let concretePrecision = slot.connectSlot?.concretePrecision || slot.concretePrecision;
                    finalPrecision = Math.min(finalPrecision, concretePrecision);
                });
            }
            // ... Max 和 Texture 模式处理
        }
    }
}
```

#### 主节点系统 (manual/master/SurfaceMasterNode.ts)
```typescript
// Surface Master Node - PBR 主节点 (SurfaceMasterNode.ts:14-54)
@register({
    title: 'Surface',
    master: true,
})
export default class SurfaceMasterNode extends MasterNode {
    get templatePath() {
        return path.join(shaderContext.shaderTemplatesDir, 'master/SurfaceMasterNode.effect');
    }

    data = {
        inputs: [
            // 顶点着色器槽 (codeChunk: 0)
            slot('Vertex Position', Vec3.ZERO, 'vec3', 'vector', { slotType: MasterSlotType.Vertex, codeChunk: 0 }),
            slot('Vertex Normal', Vec3.ZERO, 'vec3', 'vector', { slotType: MasterSlotType.Vertex, codeChunk: 0 }),

            // 片段着色器槽 (codeChunk: 3) - PBR 材质属性
            slot('Albedo', new Vec4(0.5, 0.5, 0.5, 0.5), 'color', 'vector', { slotType: MasterSlotType.Fragment, codeChunk: 3 }),
            slot('Metallic', 0.6, 'float', 'vector', { slotType: MasterSlotType.Fragment, codeChunk: 3 }),
            slot('Roughness', 0.5, 'float', 'vector', { slotType: MasterSlotType.Fragment, codeChunk: 3 }),
            // ... 其他 PBR 属性
        ],
    };
}
```

### 🗂️ 图数据管理 (`src/shader-graph/base/graph-data-mgr.ts`)

#### 数据持久化与热重载
```typescript
export class GraphDataMgr extends BaseMgr {
    protected _dirty = false;                  // 脏数据标记
    protected lastGraphData: GraphData | undefined; // 备份数据
    public graphData: GraphData | null = null; // 当前图数据

    // 防抖处理 - 100ms 延迟保存
    private onDirtyDebounce = debounce(this.onDirty.bind(this), 100);

    // 默认着色器图创建工厂方法 (graph-data-mgr.ts:29-57)
    public static async createDefaultShaderGraph(type = 'SurfaceMasterNode', graphType = 'Graph', graphName = 'New Shader Graph') {
        const graphGraphData: GraphData = {
            type: graphType,
            name: graphName,
            nodes: {},      // 节点映射
            graphs: {},     // 子图映射
            lines: {},      // 连线映射
            details: {
                properties: [], // 着色器属性数组
            },
        };

        // 添加默认主节点
        const blockData = await getBlockDataByType(type);
        if (blockData) {
            blockData.position = { x: 347, y: -280 }; // 默认位置
            graphGraphData.nodes[generateUUID()] = blockData;
        }

        return yaml.dump(graphGraphData);
    }

    // 数据验证与兼容性处理 (graph-data-mgr.ts:231-265)
    protected validateGraphData(assetInfo: AssetInfo, graphData: GraphData) {
        let dirty = false;

        // 名称同步
        const newName = getName(assetInfo.path);
        if (graphData.name !== newName) {
            graphData.name = newName;
            dirty = true;
        }

        // 节点槽位补全 - 处理版本升级时的新增槽位
        for (const uuid in graphData.nodes) {
            const block: BlockData = graphData.nodes[uuid];
            const blockTemplate = getBlockTemplateByType(block.type);
            if (blockTemplate) {
                const inputPins = block.details.inputPins;
                if (inputPins && blockTemplate.data.details.inputPins) {
                    blockTemplate.data.details.inputPins.forEach((pin: PinData, index: number) => {
                        if (!inputPins[index]) {
                            inputPins[index] = pin; // 补全缺失槽位
                            dirty = true;
                        }
                    });
                }
            }
        }
    }
}
```

### 📊 接口定义系统 (`src/shader-graph/interface.ts`)

#### 核心数据结构
```typescript
// 属性数据 - 用于存储 Graph Property 数据 (interface.ts:7-16)
export class PropertyData {
    id: string = generateUUID();              // 属性唯一 ID
    type = '';                                // 属性类型 (float, vec3, color 等)
    name = '';                                // 属性显示名称
    declareType = 'PropertyNode';             // 声明类型标识
    outputPins: PinData[] = [];               // 输出槽位数据
}

// 节点详细信息 - 节点的附加信息 (interface.ts:21-29)
export interface INodeDetails {
    propertyID?: string;                      // 关联的属性 ID
    title?: string;                           // 节点标题
    subGraph?: string;                        // 子图引用
    inputPins?: PinData[];                    // 输入槽位
    outputPins?: PinData[];                   // 输出槽位
    [key: string]: any;                       // 扩展字段
}
```

### 🎛️ 精密的编辑操作系统

#### 智能复制粘贴算法 (graph-editor-mgr.ts:185-264)
```typescript
private usePaste(mousePoint: { x: number; y: number }, list: GraphEditorOtherOptions[]) {
    const offsetPoint = getOffsetPointByMousePoint(list, mousePoint);

    // Phase 1: 重建节点并重新映射 UUID
    const blockIDMap: Map<string, string> = new Map();
    list.forEach((item: GraphEditorOtherOptions) => {
        const newBlockID = generateUUID();
        const data = JSON.parse(JSON.stringify(item.blockData));
        data.position.x += offsetPoint.x; // 位置偏移
        data.position.y += offsetPoint.y;
        this.graphForge.addBlock(data, newBlockID);
        blockIDMap.set(item.uuid, newBlockID);
    });

    // Phase 2: 重建连线关系 - 复杂的连接重建算法
    const noDuplicatesArray: string[] = [];
    const newLines: LineData[] = [];
    list.forEach((item: GraphEditorOtherOptions) => {
        const block = blockMap[item.uuid];

        // 遍历输出槽的连接
        block.getOutputPinsList().forEach((pin: Pin) => {
            pin.connectPins.forEach((connectPin: Pin) => {
                const outputNode = blockIDMap.get(connectPin.block.uuid);
                if (!outputNode) return; // 跳过外部连接

                const newLineInfo: LineData = {
                    type: 'curve',
                    input: {
                        node: blockIDMap.get(pin.block.uuid) || pin.block.uuid,
                        param: pin.desc.tag,
                    },
                    output: {
                        node: blockIDMap.get(connectPin.block.uuid) || connectPin.block.uuid,
                        param: connectPin.desc.tag,
                    },
                    details: {},
                };

                // 去重标签
                const tag = newLineInfo.input.node + newLineInfo.input.param +
                    newLineInfo.output.node + newLineInfo.output.param;

                if (!noDuplicatesArray.includes(tag)) {
                    noDuplicatesArray.push(tag);
                    newLines.push(newLineInfo);
                }
            });
        });
    });

    // Phase 3: 延迟添加连线 - 确保节点已完全创建
    setTimeout(() => {
        newLines.forEach((line: LineData) => {
            this.graphForge.addLine(line);
        });
    }, 500); // HACK: 500ms 延迟确保连线添加成功
}
```

## 测试与质量

### 测试结构
```
tests/
└── base.test.ts     // 基础功能测试
```

### 测试策略
- **单元测试**：使用 Node.js test runner
- **功能测试**：核心编辑功能验证
- **集成测试**：与 Cocos Creator 编辑器集成

### 代码质量
- TypeScript 严格模式
- ESLint 代码规范检查
- 模块化架构设计

## 常见问题 (FAQ)

### Q: 如何添加自定义节点？
A: 可以通过两种方式添加：
1. **手动节点**：在 `shader-node/assets/operation/manual/` 下创建 TypeScript 文件，继承 `ShaderNode` 基类
2. **自动生成**：在 `compile-shader/shader-templates/chunks/` 下编写 GLSL 函数，使用注释驱动生成

### Q: 着色器编译失败怎么办？
A: 检查步骤：
1. 验证所有必需的主节点输入槽都已连接
2. 检查节点连接类型是否匹配（vector、texture2D 等）
3. 查看控制台中的具体错误信息
4. 确保没有循环依赖关系

### Q: 如何调试生成的着色器代码？
A: 调试方法：
1. 查看生成的 `.effect` 文件内容
2. 使用 Cocos Creator 材质编辑器进行测试
3. 检查 Surface Master Node 的各个槽位映射
4. 使用 Preview Node 进行局部调试

### Q: 支持哪些着色器类型？
A: 目前支持：
- **Surface Master Node**：标准 PBR 着色器
- **Unlit Master Node**：无光照着色器
- **子图系统**：支持创建可复用的节点组合

### Q: 节点精度系统如何工作？
A: 精度传播机制：
- **Min 模式**：使用输入中的最低精度
- **Max 模式**：使用输入中的最高精度
- **Fixed 模式**：使用固定精度值
- **Texture 模式**：纹理相关的特殊精度

## 性能优化建议

### 📊 着色器性能优化
1. **精度选择**：合理使用 `mediump` 和 `lowp` 精度
2. **内联节点**：简单运算使用 `@inline` 标记
3. **纹理采样**：避免在循环中进行纹理采样
4. **分支优化**：减少动态分支，使用静态分支

### 🎯 编辑器性能优化
1. **节点数量**：大型图建议使用子图分解
2. **实时预览**：复杂场景可关闭实时预览
3. **内存管理**：定期清理未使用的节点缓存

## 相关文件清单

### 核心文件
- `src/main.ts` - 主进程入口
- `src/shader-graph/` - 着色器图核心逻辑
- `src/block-forge/` - 节点图形编辑器
- `src/panels/shader-graph/` - 编辑器面板UI

### 资产文件
- `shader-node/assets/` - 节点定义和注册
- `static/shader-graph/` - 面板样式和HTML
- `i18n/` - 国际化文件

### 配置文件
- `package.json` - 扩展配置和依赖
- `tsconfig.json` - TypeScript 配置
- `README.md` / `README.zh-CN.md` - 使用说明

---

## 🎯 深度分析总结

通过对 `shader-graph/src/shader-graph/` 核心实现的深入分析，浮浮酱发现了这个项目的精妙设计：

### 🏆 架构优势
1. **模块化管理器架构**：单例模式 + 责任分离，每个管理器专注特定功能
2. **声明式节点系统**：注释驱动的自动代码生成，大幅提升开发效率
3. **智能连接验证**：基于类型系统的连接合法性检查
4. **高级编辑操作**：复制粘贴算法考虑了 UUID 重映射和延迟连线等细节
5. **数据持久化设计**：YAML 格式 + 防抖保存 + 版本兼容性处理

### 🔧 技术亮点
- **HTMLGraphForgeElement**：完整的 Web Components 自定义元素
- **GLSL 解析引擎**：正则表达式驱动的函数解析和代码生成
- **精度传播算法**：Min/Max/Fixed/Texture 四种精度计算模式
- **事件驱动架构**：解耦的消息通信系统
- **模板系统**：支持多通道渲染的着色器模板

### 💡 设计哲学
这个项目体现了现代化的前端架构设计理念：
- **关注点分离**：UI、数据、业务逻辑清晰分层
- **扩展性设计**：插件化的节点注册机制
- **用户体验**：智能的操作反馈和错误处理
- **开发者友好**：完善的类型定义和接口规范

*模块版本：1.0.0 | 深度分析完成：2025-09-14*