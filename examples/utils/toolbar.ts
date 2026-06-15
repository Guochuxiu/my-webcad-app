type ToolbarActions = {
    onImportModel?: () => void;
    onImportPointCloud?: () => void;
};

export const getToolBar = (_view?: unknown, _app?: unknown, actions: ToolbarActions = {}) => {
    return [
        {
            key: 'group0',
            more: [
                {
                    type: 'splitVertical',
                    width: '7.5rem',
                    topAttr: {
                        iconName: 'upload',
                        label: '导入模型',
                        callback: async () => {
                            actions.onImportModel?.();
                        }
                    },
                    bottomAttr: {
                        iconName: 'upload',
                        label: '导入点云',
                        callback: async () => {
                            actions.onImportPointCloud?.();
                        }
                    }
                }
            ]
        }
    ];
};
