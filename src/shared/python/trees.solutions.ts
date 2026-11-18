/** Full editor contents that pass each tree exercise. Used by the smoke test only. */
export const TREE_SOLUTIONS: Record<string, string> = {
  'tr-node': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None
`,
  'tr-build': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def build_tree() -> Node:
    root = Node("A")
    root.left = Node("B")
    root.right = Node("C")
    root.left.left = Node("D")
    root.left.right = Node("E")
    return root
`,
  'tr-preorder': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def pre_order(node: Node | None) -> list[int | str]:
    if node is None:
        return []
    return [node.data] + pre_order(node.left) + pre_order(node.right)
`,
  'tr-inorder': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def in_order(node: Node | None) -> list[int | str]:
    if node is None:
        return []
    return in_order(node.left) + [node.data] + in_order(node.right)
`,
  'tr-postorder': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def post_order(node: Node | None) -> list[int | str]:
    if node is None:
        return []
    return post_order(node.left) + post_order(node.right) + [node.data]
`,
  'tr-bfs': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def breadth_first(root: Node | None) -> list[int | str]:
    if root is None:
        return []
    order = []
    waiting = [root]
    while waiting:
        node = waiting.pop(0)
        order.append(node.data)
        if node.left is not None:
            waiting.append(node.left)
        if node.right is not None:
            waiting.append(node.right)
    return order
`,
  'tr-search': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def search(node: Node | None, key: int) -> Node | None:
    if node is None:
        return None
    if key == node.data:
        return node
    if key < node.data:
        return search(node.left, key)
    return search(node.right, key)
`,
  'tr-insert': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def insert(node: Node | None, key: int) -> Node:
    if node is None:
        return Node(key)
    if key < node.data:
        node.left = insert(node.left, key)
    elif key > node.data:
        node.right = insert(node.right, key)
    return node
`,
  'tr-delete-simple': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def delete(node: Node | None, key: int) -> Node | None:
    if node is None:
        return None
    if key < node.data:
        node.left = delete(node.left, key)
    elif key > node.data:
        node.right = delete(node.right, key)
    else:
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
    return node
`,
  'tr-delete-two': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.left = None
        self.right = None

def delete(node: Node | None, key: int) -> Node | None:
    if node is None:
        return None
    if key < node.data:
        node.left = delete(node.left, key)
    elif key > node.data:
        node.right = delete(node.right, key)
    else:
        if node.left is None:
            return node.right
        if node.right is None:
            return node.left
        successor = node.right
        while successor.left is not None:
            successor = successor.left
        node.data = successor.data
        node.right = delete(node.right, successor.data)
    return node
`
}
