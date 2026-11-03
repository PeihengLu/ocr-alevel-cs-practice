/**
 * Exercises for the Linked list concepts chapter.
 * Hidden tests stay with the exercise; the editor shows the prompt and starter.
 */

export interface PythonExercise {
  id: string
  title: string
  prompt: string
  starterCode: string
  tests: string
}

const NODE = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None
`

const LIST = `class LinkedList:
    def __init__(self):
        self.head = None
`

export const LINKED_LIST_EXERCISES: PythonExercise[] = [
  {
    id: 'll-node',
    title: '1. The Node class',
    prompt: `A class is a blueprint. Calling Node(5) creates an object and runs __init__.

self is that object. Store two attributes:
- data — the value you were given
- next — None for now (this node does not point anywhere yet)

None means "no node".`,
    starterCode: `class Node:
    def __init__(self, data):
        # self.data = ...
        # self.next = ...
        pass
`,
    tests: `
def __t_data():
    n = Node(5)
    assert n.data == 5, "data should be 5"

__check("stores the value on data", __t_data)

def __t_text():
    n = Node("ada")
    assert n.data == "ada", "data should keep the value you passed in"

__check("stores text as well as numbers", __t_text)

def __t_next():
    n = Node(5)
    assert n.next is None, "next should start as None"

__check("next starts as None", __t_next)

def __t_separate():
    a = Node(1)
    b = Node(2)
    assert a.data == 1 and b.data == 2, "each object keeps its own data"

__check("two nodes keep different data", __t_separate)
`
  },
  {
    id: 'll-link',
    title: '2. Link nodes with next',
    prompt: `Each node can point at another node through next.

Write build_chain() so it returns the first node of this chain:

1 → 2 → 3 → None

Create three Node objects, set next yourself, and return the node that holds 1.
The Node class is already written.`,
    starterCode: `${NODE}
def build_chain():
    # first = Node(1)
    # ...
    pass
`,
    tests: `
def __t_chain():
    head = build_chain()
    assert head.data == 1, "the first node should hold 1"
    assert head.next is not None and head.next.data == 2, "the second node should hold 2"
    assert head.next.next is not None and head.next.next.data == 3, "the third node should hold 3"
    assert head.next.next.next is None, "the last next should be None"

__check("chain is 1 then 2 then 3", __t_chain)
`
  },
  {
    id: 'll-list-class',
    title: '3. The LinkedList class',
    prompt: `A linked list is an object that remembers where the chain starts.

head is the first node, or None when the list is empty.

Finish __init__ so a new LinkedList has self.head = None.
The Node class is already written.`,
    starterCode: `${NODE}
class LinkedList:
    def __init__(self):
        pass
`,
    tests: `
def __t_empty():
    ll = LinkedList()
    assert ll.head is None, "a new list should have head None"

__check("a new list is empty", __t_empty)

def __t_two():
    a = LinkedList()
    b = LinkedList()
    assert a.head is None and b.head is None
    a.head = Node(1)
    assert a.head.data == 1
    assert b.head is None, "setting one list's head should not fill the other list"

__check("each list has its own head", __t_two)
`
  },
  {
    id: 'll-insert-front',
    title: '4. Front insertion',
    prompt: `insert_front(data) adds a value at the start of the list.

1. Make a new Node.
2. Point that node's next at the current head.
3. Move head to the new node.

Do this even when the list is empty (head is None).
After insert_front(1) then insert_front(2), the chain is 2 → 1 → None.`,
    starterCode: `${NODE}
${LIST}
    def insert_front(self, data):
        pass
`,
    tests: `
def __t_one():
    ll = LinkedList()
    ll.insert_front(1)
    assert ll.head is not None and ll.head.data == 1
    assert ll.head.next is None

__check("insert into an empty list", __t_one)

def __t_order():
    ll = LinkedList()
    ll.insert_front(1)
    ll.insert_front(2)
    ll.insert_front(3)
    assert ll.head.data == 3
    assert ll.head.next.data == 2
    assert ll.head.next.next.data == 1
    assert ll.head.next.next.next is None

__check("each insert becomes the new head", __t_order)
`
  },
  {
    id: 'll-append',
    title: '5. Append',
    prompt: `append(data) adds a value after every node that is already there.

When head is None, there is no node to attach to, so the new node becomes the head. Write that case on its own.
Otherwise leave head on the first node. Walk a second name, current, until current.next is None, then attach the new node there.

After append(1) then append(2) then append(3), the chain is 1 → 2 → 3 → None.`,
    starterCode: `${NODE}
${LIST}
    def append(self, data):
        pass
`,
    tests: `
def __t_empty():
    ll = LinkedList()
    ll.append("a")
    assert ll.head is not None and ll.head.data == "a"
    assert ll.head.next is None

__check("append to an empty list", __t_empty)

def __t_order():
    ll = LinkedList()
    ll.append(1)
    ll.append(2)
    ll.append(3)
    assert ll.head.data == 1
    assert ll.head.next.data == 2
    assert ll.head.next.next.data == 3
    assert ll.head.next.next.next is None

__check("appends stay in the order you added them", __t_order)
`
  },
  {
    id: 'll-to-list',
    title: '6. Traversal',
    prompt: `to_list() returns an ordinary Python list of the values, from head to the end.

Start at head. While the current node is not None, record current.data and move to current.next.
An empty list returns [].

Example: 1 → 2 → 3 becomes [1, 2, 3].`,
    starterCode: `${NODE}
${LIST}
    def to_list(self):
        pass
`,
    tests: `
def __chain(*values):
    ll = LinkedList()
    previous = None
    for value in values:
        node = Node(value)
        if previous is None:
            ll.head = node
        else:
            previous.next = node
        previous = node
    return ll

def __t_empty():
    assert LinkedList().to_list() == []

__check("empty list becomes []", __t_empty)

def __t_values():
    assert __chain(1, 2, 3).to_list() == [1, 2, 3]

__check("walks from head to the end", __t_values)

def __t_one():
    assert __chain("bee").to_list() == ["bee"]

__check("a single node becomes a one-item list", __t_one)
`
  },
  {
    id: 'll-contains',
    title: '7. Search',
    prompt: `contains(data) returns True if some node stores that value, otherwise False.

Walk from head the same way as to_list. Compare with ==.
An empty list does not contain anything, so return False.`,
    starterCode: `${NODE}
${LIST}
    def contains(self, data):
        pass
`,
    tests: `
def __chain(*values):
    ll = LinkedList()
    previous = None
    for value in values:
        node = Node(value)
        if previous is None:
            ll.head = node
        else:
            previous.next = node
        previous = node
    return ll

def __t_empty():
    assert LinkedList().contains(1) is False

__check("an empty list contains nothing", __t_empty)

def __t_yes():
    ll = __chain("ann", "bo", "cy")
    assert ll.contains("bo") is True
    assert ll.contains("cy") is True

__check("finds a value in the middle and at the end", __t_yes)

def __t_no():
    assert __chain(1, 2, 3).contains(9) is False

__check("returns False when the value is missing", __t_no)
`
  },
  {
    id: 'll-delete',
    title: '8. Deletion',
    prompt: `delete(data) removes the first node whose data matches. Leave later copies in place.

If the head is the match, move head to head.next.
Otherwise keep a current node and look at current.next. When current.next is the match, skip it: current.next = current.next.next.

If the value is not in the list, change nothing.
If the list is empty, do nothing.`,
    starterCode: `${NODE}
${LIST}
    def delete(self, data):
        pass
`,
    tests: `
def __chain(*values):
    ll = LinkedList()
    previous = None
    for value in values:
        node = Node(value)
        if previous is None:
            ll.head = node
        else:
            previous.next = node
        previous = node
    return ll

def __values(ll):
    out = []
    current = ll.head
    while current is not None:
        out.append(current.data)
        current = current.next
    return out

def __t_head():
    ll = __chain(1, 2, 3)
    ll.delete(1)
    assert __values(ll) == [2, 3]

__check("removes the head", __t_head)

def __t_middle():
    ll = __chain(1, 2, 3)
    ll.delete(2)
    assert __values(ll) == [1, 3]

__check("removes a middle node", __t_middle)

def __t_tail():
    ll = __chain(1, 2, 3)
    ll.delete(3)
    assert __values(ll) == [1, 2]

__check("removes the last node", __t_tail)

def __t_only():
    ll = __chain(4)
    ll.delete(4)
    assert ll.head is None

__check("removing the only node leaves the list empty", __t_only)

def __t_missing():
    ll = __chain(1, 2)
    ll.delete(9)
    assert __values(ll) == [1, 2]

__check("a missing value leaves the list alone", __t_missing)

def __t_first_copy():
    ll = __chain(1, 1, 2)
    ll.delete(1)
    assert __values(ll) == [1, 2]

__check("removes only the first match", __t_first_copy)

def __t_empty():
    ll = LinkedList()
    ll.delete(1)
    assert ll.head is None

__check("deleting from an empty list does nothing", __t_empty)
`
  },
  {
    id: 'll-length',
    title: '9. Length',
    prompt: `length() returns how many nodes are in the list.

Walk from head until None, counting as you go.
An empty list has length 0. Do not use a Python len() on the nodes — there is nothing to call len() on until you walk them yourself.`,
    starterCode: `${NODE}
${LIST}
    def length(self):
        pass
`,
    tests: `
def __chain(*values):
    ll = LinkedList()
    previous = None
    for value in values:
        node = Node(value)
        if previous is None:
            ll.head = node
        else:
            previous.next = node
        previous = node
    return ll

def __t_empty():
    assert LinkedList().length() == 0

__check("an empty list has length 0", __t_empty)

def __t_three():
    assert __chain(1, 2, 3).length() == 3

__check("counts every node", __t_three)

def __t_one():
    assert __chain("x").length() == 1

__check("a single node has length 1", __t_one)
`
  }
]
