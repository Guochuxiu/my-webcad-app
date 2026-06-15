import { CmdBase } from '@/common';

export class CmdLoadScene extends CmdBase<any> {

    async commit() {
        console.log('CmdLoadScene commit');
        super.commit();
    }
}
