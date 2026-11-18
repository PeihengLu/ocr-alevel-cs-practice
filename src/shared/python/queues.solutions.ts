/** Full editor contents that pass each queue exercise. Used by the smoke test only. */
export const QUEUE_SOLUTIONS: Record<string, string> = {
  'qu-linear-create': `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0
`,
  'qu-linear-enqueue': `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data) or self.rear == len(self.data) - 1:
            return False
        self.rear = self.rear + 1
        self.data[self.rear] = item
        self.size = self.size + 1
        return True
`,
  'qu-linear-dequeue': `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data) or self.rear == len(self.data) - 1:
            return False
        self.rear = self.rear + 1
        self.data[self.rear] = item
        self.size = self.size + 1
        return True

    def dequeue(self) -> int | str | None:
        if self.size == 0:
            return None
        item = self.data[self.front]
        self.data[self.front] = None
        self.front = self.front + 1
        self.size = self.size - 1
        return item
`,
  'qu-linear-waste': `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data) or self.rear == len(self.data) - 1:
            return False
        self.rear = self.rear + 1
        self.data[self.rear] = item
        self.size = self.size + 1
        return True

    def dequeue(self) -> int | str | None:
        if self.size == 0:
            return None
        item = self.data[self.front]
        self.data[self.front] = None
        self.front = self.front + 1
        self.size = self.size - 1
        return item

def wasted_after_use(q: LinearQueue) -> tuple[bool, bool, list]:
    q.dequeue()
    q.dequeue()
    ok_d = q.enqueue("D")
    ok_e = q.enqueue("E")
    return (ok_d, ok_e, q.data)
`,
  'qu-circular-create': `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0
`,
  'qu-circular-enqueue': `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data):
            return False
        if self.size == 0:
            self.front = 0
            self.rear = 0
        else:
            self.rear = (self.rear + 1) % len(self.data)
        self.data[self.rear] = item
        self.size = self.size + 1
        return True
`,
  'qu-circular-dequeue': `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data):
            return False
        if self.size == 0:
            self.front = 0
            self.rear = 0
        else:
            self.rear = (self.rear + 1) % len(self.data)
        self.data[self.rear] = item
        self.size = self.size + 1
        return True

    def dequeue(self) -> int | str | None:
        if self.size == 0:
            return None
        item = self.data[self.front]
        self.data[self.front] = None
        self.size = self.size - 1
        if self.size == 0:
            self.front = 0
            self.rear = -1
        else:
            self.front = (self.front + 1) % len(self.data)
        return item
`,
  'qu-circular-wrap': `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0

    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data):
            return False
        if self.size == 0:
            self.front = 0
            self.rear = 0
        else:
            self.rear = (self.rear + 1) % len(self.data)
        self.data[self.rear] = item
        self.size = self.size + 1
        return True

    def dequeue(self) -> int | str | None:
        if self.size == 0:
            return None
        item = self.data[self.front]
        self.data[self.front] = None
        self.size = self.size - 1
        if self.size == 0:
            self.front = 0
            self.rear = -1
        else:
            self.front = (self.front + 1) % len(self.data)
        return item

def fill_after_dequeue(q: CircularQueue) -> list:
    q.dequeue()
    q.enqueue("D")
    q.enqueue("E")
    return q.data
`,
  'qu-linked-create': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.next = None

class LinkedQueue:
    def __init__(self) -> None:
        self.front = None
        self.rear = None
`,
  'qu-linked-enqueue': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.next = None

class LinkedQueue:
    def __init__(self) -> None:
        self.front = None
        self.rear = None

    def enqueue(self, item: int | str) -> None:
        node = Node(item)
        if self.front is None:
            self.front = node
            self.rear = node
        else:
            self.rear.next = node
            self.rear = node
`,
  'qu-linked-dequeue': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.next = None

class LinkedQueue:
    def __init__(self) -> None:
        self.front = None
        self.rear = None

    def enqueue(self, item: int | str) -> None:
        node = Node(item)
        if self.front is None:
            self.front = node
            self.rear = node
        else:
            self.rear.next = node
            self.rear = node

    def dequeue(self) -> int | str | None:
        if self.front is None:
            return None
        item = self.front.data
        self.front = self.front.next
        if self.front is None:
            self.rear = None
        return item
`,
  'qu-linked-peek': `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.next = None

class LinkedQueue:
    def __init__(self) -> None:
        self.front = None
        self.rear = None

    def enqueue(self, item: int | str) -> None:
        node = Node(item)
        if self.front is None:
            self.front = node
            self.rear = node
        else:
            self.rear.next = node
            self.rear = node

    def peek(self) -> int | str | None:
        if self.front is None:
            return None
        return self.front.data
`
}
