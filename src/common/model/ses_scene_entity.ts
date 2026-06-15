import { Constants, FSCore, Model, ResourceManager } from '@fs/cadnginx';
import { SesNodeEntity } from './ses_node_entity';

/**
 * ses场景
 */
export class SesSceneEntity extends FSCore.Model.CADEntity<any> {
    public rootLink: FSCore.Kinematic.Link;
    constructor() {
        super(undefined);
    }

    public async loadSes(files: File[]|ArrayBuffer|Blob, entityClass = SesNodeEntity) { 
        
        if (files instanceof ArrayBuffer) {
            const blob = new Blob([files], { type: 'application/octet-stream' });
            files = [new File([blob], 'scene.ses')];
        } else if (files instanceof Blob) {
            files = [new File([files], 'scene.ses')];
        }
        ResourceManager.registerLoaderConfig(Constants.FileType.SES, {
            objectNodeClass: entityClass
        });
        const results = await ResourceManager.loadFromFiles(files);
        const { nodes } = results;
        nodes?.forEach(node => {
            this.addChild(node);
        });
        this.rootLink = results.links.find(link => link.isRoot);

        return results;
    }

    destroy(): void {
        super.destroy();
        this.rootLink.remove();
    }
    
}
