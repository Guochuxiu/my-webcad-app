import * as THREE from 'three';
import GUI from 'lil-gui';
import { CypWeldCanvas } from '@/projects/cypweld/view/cypweld_canvas';
import { Display } from '@fs/cadnginx';
import { WeldSeamEntity } from '@/projects/cypweld/model/weld_seam_entity';

/**
 * 设置材质调试 GUI
 */
export function setupMaterialDebugGUI(view: CypWeldCanvas) {
    const gui = new GUI();
    gui.title('Three.js 材质调试');
        
    // 面材质参数
    const faceParams = {
        color: '#f3f3f3',
        metalness: 0.5,
        roughness: 1.0,
        emissive: '#000000',
        emissiveIntensity: 0
    };

    // 线材质参数
    const lineParams = {
        color: '#000000'
    };
    const meshMaterialSet = new Set<THREE.MeshPhysicalMaterial>();
    const lineMaterialSet = new Set<THREE.LineBasicMaterial>();
    
    // 面材质控制组
    const faceFolder = gui.addFolder('面材质 (MeshPhysicalMaterial)');
    const faceColorController = faceFolder.addColor(faceParams, 'color')
        .name('颜色')
        .onChange((value: string) => {
            const color = new THREE.Color(value);
            meshMaterialSet.forEach(mat => {
                mat.color.copy(color);
                mat.needsUpdate = true;
            });
            window.grid?.children.forEach(element => {
                if (element instanceof THREE.Mesh) {
                    element.material.color.copy(color);
                    element.needsUpdate = true;
                }
            });
            view.dirty();
        });
    
    const metalnessController = faceFolder.add(faceParams, 'metalness', 0, 1, 0.01)
        .name('金属度')
        .onChange((value: number) => {
            meshMaterialSet.forEach(mat => {
                mat.metalness = value;
                mat.needsUpdate = true;
            });
            view.dirty();
        });
    
    const roughnessController = faceFolder.add(faceParams, 'roughness', 0, 1, 0.01)
        .name('粗糙度')
        .onChange((value: number) => {
            meshMaterialSet.forEach(mat => {
                mat.roughness = value;
                mat.needsUpdate = true;
            });
            view.dirty();
        });
    
    const emissiveColorController = faceFolder.addColor(faceParams, 'emissive')
        .name('自发光颜色')
        .onChange((value: string) => {
            const color = new THREE.Color(value);
            meshMaterialSet.forEach(mat => {
                mat.emissive.copy(color);
                mat.needsUpdate = true;
            });
            view.dirty();
        });
    
    const emissiveIntensityController = faceFolder.add(faceParams, 'emissiveIntensity', 0, 5, 0.1)
        .name('自发光强度')
        .onChange((value: number) => {
            meshMaterialSet.forEach(mat => {
                mat.emissiveIntensity = value;
                mat.needsUpdate = true;
            });
            view.dirty();
        });

    // 线材质控制组
    const lineFolder = gui.addFolder('线材质');
    const colorController = lineFolder.addColor(lineParams, 'color')
        .name('颜色')
        .onChange((value: string) => {
            lineMaterialSet.forEach(mat => {
                mat.color.set(value);
                mat.needsUpdate = true;
            });
            view.dirty();
        });
    
    // 监听选择变化，更新 GUI 参数
    view.signalSelectChange.listen(e => {
        console.log(e);
        const obj = e.data.displays?.[0];

        if (obj instanceof Display.FeatureLineDisplay) {
            const pathInfos = obj.entity.pathInfos;
            const seamLine = new WeldSeamEntity(
                [
                    new THREE.Vector3().fromArray(pathInfos[0].pathPosition.slice(0, 3)),
                    new THREE.Vector3().fromArray(pathInfos[0].pathPosition.slice(3))
                ],
                [
                    new THREE.Vector3(0, -1, 1),
                    new THREE.Vector3(0, -1, 1)
                ]
            );
            view.addModel(seamLine);
        }
        meshMaterialSet.clear();
        lineMaterialSet.clear();
        e.data.displays?.forEach(display => {
            display.viewObj.traverse(obj => {
                const material = obj.material;

                if (material instanceof THREE.MeshPhysicalMaterial || material instanceof THREE.LineBasicMaterial) {
                    if (material instanceof THREE.MeshPhysicalMaterial) {
                        meshMaterialSet.add(material);
                    } else {
                        lineMaterialSet.add(material);
                    }
                }
            });
        });

        if (meshMaterialSet.size) {
            const meshMaterial = Array.from(meshMaterialSet).find(mat => mat instanceof THREE.MeshPhysicalMaterial);

            if (meshMaterial) {
                const { metalness, emissiveIntensity, emissive, roughness, color } = meshMaterial;
                faceParams.metalness = metalness;
                faceParams.emissiveIntensity = emissiveIntensity;
                // 设置自发光颜色（转换为十六进制字符串）
                faceParams.emissive = '#' + emissive.getHexString();
                faceParams.roughness = roughness;
                // 设置颜色（转换为十六进制字符串）
                faceParams.color = '#' + color.getHexString();
                // 更新 GUI 控制器显示
                faceColorController.updateDisplay();
                metalnessController.updateDisplay();
                roughnessController.updateDisplay();
                emissiveColorController.updateDisplay();
                emissiveIntensityController.updateDisplay();
            }
        }

        if (lineMaterialSet.size) {
            const lineMaterial = Array.from(lineMaterialSet).find(mat => mat instanceof THREE.LineBasicMaterial);

            if (lineMaterial) {
                lineParams.color = lineMaterial.color.getHexString();
                colorController.updateDisplay();
            }
        }
    });

    // 展开所有文件夹
    faceFolder.open();
    lineFolder.open();
}
