/**
 * Exercises for the Trees and binary search trees chapter,
 * including pre-order, in-order, post-order, and breadth-first traversal.
 */

import type { PythonExercise } from './linkedList.ts'

const NODE = `class Node:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None
`

const SAMPLE = `
def __sample():
    #       A
    #      / \\
    #     B   C
    #    / \\   \\
    #   D   E   F
    root = Node("A")
    root.left = Node("B")
    root.right = Node("C")
    root.left.left = Node("D")
    root.left.right = Node("E")
    root.right.right = Node("F")
    return root
`

export const TREE_EXERCISES: PythonExercise[] = [
  {
    id: 'tr-node',
    title: '1. The Node class',
    prompt: `A binary-tree node stores a value and two child links.

Finish __init__ so Node(5) has:
- data — 5
- left — None
- right — None

None means that child is missing.`,
    starterCode: `class Node:
    def __init__(self, data):
        # self.data = ...
        # self.left = ...
        # self.right = ...
        pass
`,
    tests: `
def __t_fields():
    n = Node(5)
    assert n.data == 5
    assert n.left is None and n.right is None

__check("stores data with empty children", __t_fields)

def __t_separate():
    a = Node("A")
    b = Node("B")
    assert a.data == "A" and b.data == "B"

__check("each node keeps its own data", __t_separate)
`
  },
  {
    id: 'tr-build',
    title: '2. Build a binary tree',
    prompt: `build_tree() returns the root of this tree:

\`\`\`
      A
     / \\
    B   C
   / \\
  D   E
\`\`\`

Create five Node objects, link left and right yourself, and return the node that holds "A".
The Node class is already written.`,
    starterCode: `${NODE}
def build_tree():
    # root = Node("A")
    # ...
    pass
`,
    tests: `
def __t_shape():
    root = build_tree()
    assert root.data == "A"
    assert root.left.data == "B" and root.right.data == "C"
    assert root.left.left.data == "D" and root.left.right.data == "E"
    assert root.right.left is None and root.right.right is None
    assert root.left.left.left is None and root.left.left.right is None

__check("builds A with left subtree B(D,E) and right child C", __t_shape)
`
  },
  {
    id: 'tr-preorder',
    title: '3. Pre-order traversal',
    prompt: `pre_order(node) returns a list of values in pre-order: node, left subtree, right subtree.

If node is None, return [].
Otherwise return [node.data] + pre_order(node.left) + pre_order(node.right).

On this tree the order is A, B, D, E, C, F:

\`\`\`
      A
     / \\
    B   C
   / \\   \\
  D   E   F
\`\`\``,
    starterCode: `${NODE}
def pre_order(node):
    pass
`,
    tests: `${SAMPLE}
def __t_empty():
    assert pre_order(None) == []

__check("None returns []", __t_empty)

def __t_order():
    assert pre_order(__sample()) == ["A", "B", "D", "E", "C", "F"]

__check("visits node before both subtrees", __t_order)
`
  },
  {
    id: 'tr-inorder',
    title: '4. In-order traversal',
    prompt: `in_order(node) returns values as left subtree, node, right subtree.

If node is None, return [].
On the same sample tree the order is D, B, E, A, C, F.

On a binary search tree, in-order visits keys from smallest to largest.`,
    starterCode: `${NODE}
def in_order(node):
    pass
`,
    tests: `${SAMPLE}
def __t_empty():
    assert in_order(None) == []

__check("None returns []", __t_empty)

def __t_order():
    assert in_order(__sample()) == ["D", "B", "E", "A", "C", "F"]

__check("visits node between the subtrees", __t_order)

def __t_bst():
    root = Node(8)
    root.left = Node(3)
    root.right = Node(10)
    root.left.left = Node(1)
    root.left.right = Node(6)
    assert in_order(root) == [1, 3, 6, 8, 10]

__check("in-order of a BST is sorted", __t_bst)
`
  },
  {
    id: 'tr-postorder',
    title: '5. Post-order traversal',
    prompt: `post_order(node) returns values as left subtree, right subtree, node.

If node is None, return [].
On the sample tree the order is D, E, B, F, C, A.

OCR names post-order as the depth-first tree traversal to apply: children are finished before the node itself.`,
    starterCode: `${NODE}
def post_order(node):
    pass
`,
    tests: `${SAMPLE}
def __t_empty():
    assert post_order(None) == []

__check("None returns []", __t_empty)

def __t_order():
    assert post_order(__sample()) == ["D", "E", "B", "F", "C", "A"]

__check("visits node after both subtrees", __t_order)
`
  },
  {
    id: 'tr-bfs',
    title: '6. Breadth-first traversal',
    prompt: `breadth_first(root) visits level by level and returns the values in that order.

Use a list as a queue: append to enqueue, pop(0) to dequeue.
1. If root is None, return [].
2. Start with the root in the queue.
3. While the queue is not empty, dequeue a node, record its data, then enqueue left and right children if they exist.

On the sample tree the order is A, B, C, D, E, F.`,
    starterCode: `${NODE}
def breadth_first(root):
    pass
`,
    tests: `${SAMPLE}
def __t_empty():
    assert breadth_first(None) == []

__check("None returns []", __t_empty)

def __t_order():
    assert breadth_first(__sample()) == ["A", "B", "C", "D", "E", "F"]

__check("visits level by level", __t_order)
`
  },
  {
    id: 'tr-search',
    title: '7. BST search',
    prompt: `search(node, key) looks up a key in a binary search tree.

1. If node is None, return None.
2. If key equals node.data, return that node.
3. If key is smaller, search the left child.
4. If key is larger, search the right child.`,
    starterCode: `${NODE}
def search(node, key):
    pass
`,
    tests: `
def __bst():
    root = Node(8)
    root.left = Node(3)
    root.right = Node(10)
    root.left.left = Node(1)
    root.left.right = Node(6)
    root.left.right.left = Node(4)
    root.left.right.right = Node(7)
    root.right.right = Node(14)
    root.right.right.left = Node(13)
    return root

def __t_found():
    root = __bst()
    assert search(root, 7) is root.left.right.right
    assert search(root, 8) is root

__check("finds a key in the middle and at the root", __t_found)

def __t_missing():
    assert search(__bst(), 9) is None
    assert search(None, 1) is None

__check("returns None when the key is absent", __t_missing)
`
  },
  {
    id: 'tr-insert',
    title: '8. BST insert',
    prompt: `insert(node, key) adds a key to a binary search tree and returns the (possibly new) root.

1. If node is None, return Node(key).
2. If key is smaller, set node.left = insert(node.left, key).
3. If key is larger, set node.right = insert(node.right, key).
4. Return node.

Equal keys are not used here — leave the tree unchanged if the key is already present.`,
    starterCode: `${NODE}
def insert(node, key):
    pass
`,
    tests: `
def __t_root():
    root = insert(None, 8)
    assert root.data == 8 and root.left is None and root.right is None

__check("insert into empty tree creates the root", __t_root)

def __t_children():
    root = None
    for key in [8, 3, 10, 1, 6]:
        root = insert(root, key)
    assert root.data == 8
    assert root.left.data == 3 and root.right.data == 10
    assert root.left.left.data == 1 and root.left.right.data == 6

__check("attaches each key where the search falls off", __t_children)

def __t_nine():
    root = None
    for key in [8, 3, 10, 14]:
        root = insert(root, key)
    root = insert(root, 9)
    assert root.right.data == 10
    assert root.right.left.data == 9
    assert root.right.right.data == 14

__check("9 becomes the left child of 10", __t_nine)
`
  },
  {
    id: 'tr-delete-simple',
    title: '9. BST delete — leaf or one child',
    prompt: `delete(node, key) removes a key and returns the updated subtree root.

For this exercise, every deleted node is a leaf or has one child:
1. Go left if key is smaller, right if larger.
2. When you find the key, return the other child (the non-None one, or None if both are empty).

Deleting a leaf unhooks it. Deleting a one-child node lets that child take its place.`,
    starterCode: `${NODE}
def delete(node, key):
    pass
`,
    tests: `
def __tree():
    root = Node(8)
    root.left = Node(3)
    root.right = Node(10)
    root.left.left = Node(1)
    root.left.right = Node(6)
    root.left.right.right = Node(7)
    root.right.right = Node(14)
    return root

def __t_leaf():
    root = delete(__tree(), 7)
    assert root.left.right.right is None
    assert root.left.right.data == 6

__check("deletes a leaf", __t_leaf)

def __t_one_child():
    root = delete(__tree(), 10)
    assert root.right.data == 14
    assert root.right.right is None

__check("one-child node is replaced by its child", __t_one_child)

def __t_missing():
    root = __tree()
    out = delete(root, 99)
    assert out is root
    assert out.left.data == 3 and out.right.data == 10

__check("a missing key leaves the tree alone", __t_missing)
`
  },
  {
    id: 'tr-delete-two',
    title: '10. BST delete — two children',
    prompt: `Extend delete so a node with two children is removed correctly.

When the found node has both left and right:
1. Find the in-order successor — the smallest key in the right subtree (go right once, then left as far as possible).
2. Copy the successor's data into the found node.
3. Delete the successor from the right subtree.

Example: delete 3 when it has left 1 and right 6 (with 4 and 7 under 6). The successor is 4.`,
    starterCode: `${NODE}
def delete(node, key):
    pass
`,
    tests: `
def __tree():
    root = Node(8)
    root.left = Node(3)
    root.right = Node(10)
    root.left.left = Node(1)
    root.left.right = Node(6)
    root.left.right.left = Node(4)
    root.left.right.right = Node(7)
    root.right.right = Node(14)
    root.right.right.left = Node(13)
    return root

def __t_two():
    root = delete(__tree(), 3)
    assert root.left.data == 4
    assert root.left.left.data == 1
    assert root.left.right.data == 6
    assert root.left.right.left is None
    assert root.left.right.right.data == 7

__check("two-child delete copies the successor", __t_two)

def __t_leaf_still():
    root = delete(__tree(), 7)
    assert root.left.right.right is None

__check("still deletes a leaf", __t_leaf_still)

def __t_one_still():
    root = delete(__tree(), 10)
    assert root.right.data == 14 and root.right.left.data == 13

__check("still deletes a one-child node", __t_one_still)
`
  }
]
