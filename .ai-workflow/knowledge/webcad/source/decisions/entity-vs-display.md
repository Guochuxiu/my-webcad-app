# 自定义 Entity vs 复用内置 Entity

## 先问三个问题

1. 内置 Entity（BatchLine / BatchMesh / BatchPoint）的数据结构能否表达你的数据？
2. 你是否需要自定义渲染效果、自定义脏标记逻辑、或自定义业务属性？
3. 你是否准备好同时维护 Entity 和对应的 Display？

## 直接复用内置 Entity

适合复用的场景：

- 数据只有顶点、颜色、索引，没有额外业务语义
- 不需要自定义脏标记（dirtyGeometry / dirtyMaterial / dirtyPosition 够用）
- 渲染效果用标准材质即可

内置 Entity 清单：

| Entity | 用途 | Display | 导入路径 |
|--------|------|---------|---------|
| `BatchLine` | 批量线段 | `BatchLineDisplay` | `FSCore.Model.BatchLine` |
| `BatchMesh` | 批量三角面 | `BatchMeshDisplay` | `FSCore.Model.BatchMesh` |
| `BatchPoint` | 批量点 | `BatchPointDisplay` | `FSCore.Model.BatchPoint` |
| `Group` | 纯容器，无几何 | `GroupDisplay` | `FSCore.Model.Group` |
| `DomLabel` | HTML 标签 | `DomLabelDisplay` | `FSCore.Model.DomLabel` |

## 应该创建自定义 Entity

需要自定义的场景：

- 几何数据结构超出内置的 vertex/normal/indices（如焊缝路径 + 宽度 + 类型）
- 需要业务属性和计算逻辑（如面积、周长、拓扑关系）
- 需要分属性的脏标记（颜色变化只 dirtyMaterial，几何变化只 dirtyGeometry）
- Entity 承载领域语义（如 Face、Edge、WeldSeam）

Entity 基类选择：

| 基类 | 适用 | 特点 |
|------|------|------|
| `Entity` | 非空间逻辑容器 | 无位置/旋转/缩放 |
| `CADEntity<T>` | 有几何数据的空间实体 | 有 position/quaternion/scale，泛型 T 为几何数据接口 |
| `BatchEntity<T>` | 需要批量渲染 | 继承 CADEntity，有 batchId，共享 GPU buffer |
| `Group` | 纯容器 | 继承 CADEntity，无几何数据 |

## 只需要自定义 Display

如果内置 Entity 的数据结构够用，但渲染效果需要定制：

- 自定义着色器：继承 `ThreeDisplay`，用 `ShaderMaterial`
- 自定义批量渲染：继承 `BatchMeshDisplay` / `BatchLineDisplay`，覆盖颜色/材质逻辑
- 实例化渲染：用 `InstanceDisplay` 系列

Display 基类选择：

| 基类 | 适用 | 特点 |
|------|------|------|
| `ThreeDisplay` | 独立 3D 对象 | 完整 viewObj 生命周期 |
| `BatchBaseDisplay` | 批量渲染 | 共享 viewObj，索引隐藏机制 |
| `BatchLineDisplay` | 线段批量 | 虚线、粗线、LOD |
| `BatchMeshDisplay` | 面片批量 | MeshPhysicalMaterial |
| `BatchPointDisplay` | 点批量 | 自定义着色器，LOD |
| `InstanceDisplay` | 实例化渲染 | 相同几何体不同位置/颜色 |

## 组合决策速查

| 数据 | 渲染 | Entity | Display |
|------|------|--------|---------|
| 标准线段 | 标准 | `BatchLine`（内置） | `BatchLineDisplay`（内置） |
| 标准面片 | 标准 | `BatchMesh`（内置） | `BatchMeshDisplay`（内置） |
| 标准点 | 标准 | `BatchPoint`（内置） | `BatchPointDisplay`（内置） |
| 自定义几何 | 标准 | 自定义 `CADEntity<T>` | 自定义 `ThreeDisplay` |
| 标准数据 | 自定义材质 | 内置 Entity | 自定义 Display |
| 自定义几何 | 批量渲染 | 自定义 `BatchEntity<T>` | 自定义 `BatchBaseDisplay` |
| 重复几何体 | 实例化 | 内置或自定义 | `InstanceDisplay` |

## 注意事项

- 优先复用。自定义 Entity 意味着要同步维护 Display，成本翻倍
- 自定义 Entity 必须有对应 Display 并在 Canvas 中注册
- 继承已有 Entity 时，子类 Display 注册必须在父类之前
- BatchEntity 注意 `batchId` 管理：同组共享，销毁时引用计数递减
