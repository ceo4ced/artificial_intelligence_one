
import { describe, it, expect } from 'vitest';
import {
    addChild, getMaxDepth, calculateBalance, TreeNode
} from './engine.js';

describe('Trees Game Engine', () => {
    it('should calculate max depth correctly', () => {
        const root: TreeNode = {
            name: 'Root',
            type: 'folder',
            children: [
                { name: 'Child1', type: 'file' },
                {
                    name: 'Folder1',
                    type: 'folder',
                    children: [
                        { name: 'File2', type: 'file' }
                    ]
                }
            ]
        };
        // Root is depth 0. Folder1 is 1. File2 is 2.
        expect(getMaxDepth(root)).toBe(2);
    });

    it('should add child to tree correctly', () => {
        const root: TreeNode = {
            name: 'Root',
            type: 'folder',
            children: []
        };

        const newTree = addChild(root, [], { name: 'Folder1', type: 'folder' });
        expect(newTree.children?.length).toBe(1);
        expect(newTree.children![0].name).toBe('Folder1');
    });

    it('should calculate balance', () => {
        const root: TreeNode = {
            name: 'Root',
            type: 'folder',
            children: [
                {
                    name: 'D1', type: 'folder', children: [{ name: 'F1', type: 'file' }]
                }, // Depth 2 (from root: 0->1->2)
                {
                    name: 'D2', type: 'folder', children: [{ name: 'F1', type: 'file' }]
                }  // Depth 2
            ]
        };
        // Both branches have same depth (relative to root child nodes: depth 1).
        // From root: children max depth = 1.

        // Wait, getMaxDepth logic:
        // Root -> Child -> Grandchild.
        // getMaxDepth(Root) = 2.
        // calculateBalance(Root): 
        //   depths = [getMaxDepth(Child1), getMaxDepth(Child2)]
        //   Child1: has 1 child (Grandchild). getMaxDepth(Child1) = 1.
        //   Child2: has 1 child. getMaxDepth(Child2) = 1.
        //   min=1, max=1 -> 100%

        expect(calculateBalance(root)).toBe(100);
    });
});
