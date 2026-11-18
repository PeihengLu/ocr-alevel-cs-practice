/**
 * Exercises for the Queues chapter.
 * Three implementations: linear array, circular array, linked list.
 */

import type { PythonExercise } from './linkedList.ts'

const LINEAR = `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0
`

const CIRCULAR = `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.front = 0
        self.rear = -1
        self.size = 0
`

const NODE = `class Node:
    def __init__(self, data: int | str) -> None:
        self.data = data
        self.next = None
`

const LINKED = `${NODE}
class LinkedQueue:
    def __init__(self) -> None:
        self.front = None
        self.rear = None
`

export const QUEUE_EXERCISES: PythonExercise[] = [
  {
    id: 'qu-linear-create',
    title: '1. Linear queue — create',
    prompt: `A linear queue stores items in an array.
- front — index of the next item to dequeue
- rear — index of the last item enqueued
- size — how many items are stored

Finish __init__ so a new LinearQueue has data as capacity None slots, front 0, rear -1, and size 0.`,
    starterCode: `class LinearQueue:
    def __init__(self, capacity: int) -> None:
        # self.data = ...
        # self.front = ...
        # self.rear = ...
        # self.size = ...
        pass
`,
    tests: `
def __t_new():
    q = LinearQueue(4)
    assert q.data == [None, None, None, None]
    assert q.front == 0 and q.rear == -1 and q.size == 0

__check("starts empty with rear -1", __t_new)
`
  },
  {
    id: 'qu-linear-enqueue',
    title: '2. Linear queue — enqueue',
    prompt: `enqueue(item) adds at the rear of a linear queue.

1. If size equals capacity, or rear is already the last index, return False.
2. Otherwise rear = rear + 1, store item at data[rear], increase size, return True.

A linear queue never moves rear backwards. Once rear hits the last index, further enqueues fail even if early slots are empty.`,
    starterCode: `${LINEAR}
    def enqueue(self, item: int | str) -> bool:
        pass
`,
    tests: `
def __t_first():
    q = LinearQueue(3)
    assert q.enqueue("A") is True
    assert q.front == 0 and q.rear == 0 and q.size == 1 and q.data[0] == "A"

__check("first enqueue uses index 0", __t_first)

def __t_order():
    q = LinearQueue(3)
    q.enqueue("A")
    q.enqueue("B")
    assert q.rear == 1 and q.data[:2] == ["A", "B"] and q.size == 2

__check("later enqueues move rear forward", __t_order)

def __t_full():
    q = LinearQueue(2)
    assert q.enqueue(1) is True
    assert q.enqueue(2) is True
    assert q.enqueue(3) is False
    assert q.size == 2

__check("rejects enqueue when capacity is used", __t_full)
`
  },
  {
    id: 'qu-linear-dequeue',
    title: '3. Linear queue — dequeue',
    prompt: `dequeue() removes and returns the front item.

1. If size is 0, return None.
2. Read data[front], set that slot to None, move front forward by 1, decrease size, return the item.

Enqueue A then B; dequeue returns A and leaves front at 1.`,
    starterCode: `${LINEAR}
    def enqueue(self, item: int | str) -> bool:
        if self.size == len(self.data) or self.rear == len(self.data) - 1:
            return False
        self.rear = self.rear + 1
        self.data[self.rear] = item
        self.size = self.size + 1
        return True

    def dequeue(self) -> int | str | None:
        pass
`,
    tests: `
def __t_empty():
    assert LinearQueue(2).dequeue() is None

__check("dequeue on empty returns None", __t_empty)

def __t_fifo():
    q = LinearQueue(3)
    q.enqueue("A")
    q.enqueue("B")
    assert q.dequeue() == "A"
    assert q.front == 1 and q.size == 1 and q.data[0] is None

__check("dequeue returns the oldest item", __t_fifo)
`
  },
  {
    id: 'qu-linear-waste',
    title: '4. Linear queue — wasted slots',
    prompt: `wasted_after_use(q) shows the linear-queue problem.

q is a LinearQueue of capacity 4. It already holds A, B, C.
Your function must:
1. Dequeue twice (removes A and B; front moves to 2).
2. Try to enqueue "D", then try to enqueue "E".

After those steps, rear is at the last index, so E is rejected even though indexes 0 and 1 are empty.
Return a tuple: (whether D was accepted, whether E was accepted, q.data).

Use only q.enqueue and q.dequeue.`,
    starterCode: `${LINEAR}
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
    # q already holds A, B, C
    pass
`,
    tests: `
def __primed():
    q = LinearQueue(4)
    q.enqueue("A")
    q.enqueue("B")
    q.enqueue("C")
    return q

def __t_waste():
    q = __primed()
    ok_d, ok_e, data = wasted_after_use(q)
    assert ok_d is True and ok_e is False
    assert data == [None, None, "C", "D"]
    assert q.front == 2 and q.rear == 3 and q.size == 2

__check("E is rejected while early slots stay empty", __t_waste)
`
  },
  {
    id: 'qu-circular-create',
    title: '5. Circular queue — create',
    prompt: `A circular queue uses the same fields as a linear queue, but treats the array as a loop.

Finish __init__ the same way: data as capacity None slots, front 0, rear -1, size 0.`,
    starterCode: `class CircularQueue:
    def __init__(self, capacity: int) -> None:
        pass
`,
    tests: `
def __t_new():
    q = CircularQueue(4)
    assert q.data == [None, None, None, None]
    assert q.front == 0 and q.rear == -1 and q.size == 0

__check("starts empty with rear -1", __t_new)
`
  },
  {
    id: 'qu-circular-enqueue',
    title: '6. Circular queue — enqueue',
    prompt: `enqueue(item) on a circular queue:

1. If size equals capacity, return False.
2. If size is 0, set front and rear to 0.
3. Otherwise set rear to (rear + 1) % len(self.data).
4. Store item at data[rear], increase size, return True.

Full means size == capacity. The modulo wrap reuses early slots.`,
    starterCode: `${CIRCULAR}
    def enqueue(self, item: int | str) -> bool:
        pass
`,
    tests: `
def __t_first():
    q = CircularQueue(3)
    assert q.enqueue("A") is True
    assert q.front == 0 and q.rear == 0 and q.size == 1 and q.data[0] == "A"

__check("first enqueue uses index 0", __t_first)

def __t_full():
    q = CircularQueue(2)
    assert q.enqueue(1) is True
    assert q.enqueue(2) is True
    assert q.enqueue(3) is False

__check("rejects enqueue when size equals capacity", __t_full)
`
  },
  {
    id: 'qu-circular-dequeue',
    title: '7. Circular queue — dequeue',
    prompt: `dequeue() on a circular queue:

1. If size is 0, return None.
2. Read data[front], clear that slot, decrease size.
3. If size is now 0, reset front to 0 and rear to -1.
4. Otherwise set front to (front + 1) % len(self.data).
5. Return the item.`,
    starterCode: `${CIRCULAR}
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
        pass
`,
    tests: `
def __t_empty():
    assert CircularQueue(2).dequeue() is None

__check("dequeue on empty returns None", __t_empty)

def __t_fifo():
    q = CircularQueue(3)
    q.enqueue("A")
    q.enqueue("B")
    assert q.dequeue() == "A"
    assert q.front == 1 and q.size == 1 and q.data[0] is None

__check("dequeue returns the oldest item", __t_fifo)

def __t_reset():
    q = CircularQueue(2)
    q.enqueue("X")
    assert q.dequeue() == "X"
    assert q.size == 0 and q.front == 0 and q.rear == -1

__check("removing the last item resets front and rear", __t_reset)
`
  },
  {
    id: 'qu-circular-wrap',
    title: '8. Circular queue — wrap-around',
    prompt: `fill_after_dequeue(q) shows circular reuse.

q is a CircularQueue of capacity 4 holding A, B, C.
1. Dequeue once (removes A).
2. Enqueue "D", then enqueue "E".

E lands at index 0 because (3 + 1) % 4 == 0. Return q.data.
Use only q.enqueue and q.dequeue.`,
    starterCode: `${CIRCULAR}
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
    # q already holds A, B, C
    pass
`,
    tests: `
def __primed():
    q = CircularQueue(4)
    q.enqueue("A")
    q.enqueue("B")
    q.enqueue("C")
    return q

def __t_wrap():
    q = __primed()
    data = fill_after_dequeue(q)
    assert data == ["E", "B", "C", "D"]
    assert q.front == 1 and q.rear == 0 and q.size == 4

__check("enqueue after dequeue reuses index 0", __t_wrap)
`
  },
  {
    id: 'qu-linked-create',
    title: '9. Linked queue — create',
    prompt: `A linked queue stores items in nodes. front points at the next node to dequeue. rear points at the last node enqueued.

Finish LinkedQueue.__init__ so both front and rear start as None.
The Node class is already written.`,
    starterCode: `${NODE}
class LinkedQueue:
    def __init__(self) -> None:
        pass
`,
    tests: `
def __t_empty():
    q = LinkedQueue()
    assert q.front is None and q.rear is None

__check("a new linked queue is empty", __t_empty)
`
  },
  {
    id: 'qu-linked-enqueue',
    title: '10. Linked queue — enqueue',
    prompt: `enqueue(item) adds a node at the rear.

1. Make a new Node.
2. If the queue is empty (front is None), set both front and rear to the new node.
3. Otherwise link rear.next to the new node, then move rear to that node.

There is no fixed capacity — the queue grows one node at a time.`,
    starterCode: `${LINKED}
    def enqueue(self, item: int | str) -> None:
        pass
`,
    tests: `
def __t_first():
    q = LinkedQueue()
    q.enqueue("A")
    assert q.front is q.rear
    assert q.front.data == "A" and q.front.next is None

__check("first enqueue sets front and rear", __t_first)

def __t_order():
    q = LinkedQueue()
    q.enqueue("A")
    q.enqueue("B")
    q.enqueue("C")
    assert q.front.data == "A"
    assert q.front.next.data == "B"
    assert q.rear.data == "C"
    assert q.rear.next is None

__check("later enqueues extend from rear", __t_order)
`
  },
  {
    id: 'qu-linked-dequeue',
    title: '11. Linked queue — dequeue',
    prompt: `dequeue() removes and returns the front item.

1. If front is None, return None.
2. Read front.data, move front to front.next.
3. If front is now None, the queue is empty — set rear to None as well.
4. Return the item.`,
    starterCode: `${LINKED}
    def enqueue(self, item: int | str) -> None:
        node = Node(item)
        if self.front is None:
            self.front = node
            self.rear = node
        else:
            self.rear.next = node
            self.rear = node

    def dequeue(self) -> int | str | None:
        pass
`,
    tests: `
def __t_empty():
    assert LinkedQueue().dequeue() is None

__check("dequeue on empty returns None", __t_empty)

def __t_fifo():
    q = LinkedQueue()
    q.enqueue("A")
    q.enqueue("B")
    assert q.dequeue() == "A"
    assert q.front.data == "B" and q.rear.data == "B"

__check("dequeue returns the oldest item", __t_fifo)

def __t_last():
    q = LinkedQueue()
    q.enqueue("X")
    assert q.dequeue() == "X"
    assert q.front is None and q.rear is None

__check("removing the last node clears front and rear", __t_last)
`
  },
  {
    id: 'qu-linked-peek',
    title: '12. Linked queue — peek',
    prompt: `peek() returns the front item without removing it.

If front is None, return None. Otherwise return front.data and leave the links unchanged.`,
    starterCode: `${LINKED}
    def enqueue(self, item: int | str) -> None:
        node = Node(item)
        if self.front is None:
            self.front = node
            self.rear = node
        else:
            self.rear.next = node
            self.rear = node

    def peek(self) -> int | str | None:
        pass
`,
    tests: `
def __t_empty():
    assert LinkedQueue().peek() is None

__check("peek on empty returns None", __t_empty)

def __t_front():
    q = LinkedQueue()
    q.enqueue("A")
    q.enqueue("B")
    assert q.peek() == "A"
    assert q.front.data == "A" and q.front.next.data == "B"

__check("peek reads the front without removing it", __t_front)
`
  }
]
