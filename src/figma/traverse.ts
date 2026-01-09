export function traverse(node: SceneNode, callback: (node: SceneNode) => void) {
    callback(node);
    if ('children' in node) {
        for (const child of node.children) {
            traverse(child, callback);
        }
    }
}

export function collectNodes(root: SceneNode): SceneNode[] {
    const nodes: SceneNode[] = [];
    traverse(root, (node) => nodes.push(node));
    return nodes;
}
