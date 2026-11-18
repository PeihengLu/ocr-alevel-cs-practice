/**
 * Exercises for the Stacks chapter.
 * Array stack with a top pointer, matching the OCR linear-structure notes.
 */

import type { PythonExercise } from './linkedList.ts'

const STACK = `class Stack:
    def __init__(self, capacity: int) -> None:
        self.data = [None] * capacity
        self.top = -1
`

export const STACK_EXERCISES: PythonExercise[] = [
  {
    id: 'st-create',
    title: '1. Create a stack',
    prompt: `A stack stores items in an array and remembers the top index.

Finish __init__ so a new Stack has:
- self.data — a list of capacity slots, each starting as None
- self.top — -1, meaning the stack is empty

Stack(3) should hold [None, None, None] with top -1.`,
    starterCode: `class Stack:
    def __init__(self, capacity: int) -> None:
        # self.data = ...
        # self.top = ...
        pass
`,
    tests: `
def __t_slots():
    s = Stack(3)
    assert s.data == [None, None, None], "data should be capacity empty slots"
    assert s.top == -1, "an empty stack has top -1"

__check("creates empty slots and top -1", __t_slots)

def __t_sizes():
    assert len(Stack(1).data) == 1
    assert len(Stack(5).data) == 5
    assert Stack(5).top == -1

__check("capacity controls the length of data", __t_sizes)
`
  },
  {
    id: 'st-empty-full',
    title: '2. Empty and full',
    prompt: `is_empty() is True when top is -1.
is_full() is True when top is the last index, len(self.data) - 1.

The Stack class is already written. Add both methods.`,
    starterCode: `${STACK}
    def is_empty(self) -> bool:
        pass

    def is_full(self) -> bool:
        pass
`,
    tests: `
def __t_empty():
    s = Stack(2)
    assert s.is_empty() is True
    assert s.is_full() is False

__check("a new stack is empty and not full", __t_empty)

def __t_partial():
    s = Stack(2)
    s.top = 0
    s.data[0] = "a"
    assert s.is_empty() is False
    assert s.is_full() is False

__check("one item in a capacity-2 stack is neither empty nor full", __t_partial)

def __t_full():
    s = Stack(2)
    s.top = 1
    s.data[0] = "a"
    s.data[1] = "b"
    assert s.is_empty() is False
    assert s.is_full() is True

__check("top at the last index means full", __t_full)
`
  },
  {
    id: 'st-push',
    title: '3. Push',
    prompt: `push(item) adds at the top.

1. If the stack is full, return False and change nothing.
2. Otherwise increase top by 1, store item at data[top], and return True.

Pushing onto a full stack is overflow — reject it.
After push("X") then push("Y") on a capacity-3 stack, data is ["X", "Y", None] and top is 1.`,
    starterCode: `${STACK}
    def is_full(self) -> bool:
        return self.top == len(self.data) - 1

    def push(self, item: int | str) -> bool:
        pass
`,
    tests: `
def __t_one():
    s = Stack(3)
    assert s.push("X") is True
    assert s.top == 0 and s.data[0] == "X"

__check("push stores at index 0 when empty", __t_one)

def __t_order():
    s = Stack(3)
    s.push("X")
    s.push("Y")
    assert s.top == 1
    assert s.data[:2] == ["X", "Y"]

__check("each push moves top upward", __t_order)

def __t_overflow():
    s = Stack(2)
    assert s.push(1) is True
    assert s.push(2) is True
    assert s.push(3) is False
    assert s.top == 1 and s.data == [1, 2]

__check("push on a full stack returns False", __t_overflow)
`
  },
  {
    id: 'st-pop',
    title: '4. Pop',
    prompt: `pop() removes and returns the top item.

1. If the stack is empty, return None and change nothing.
2. Otherwise read data[top], set that slot to None, decrease top by 1, and return the item.

Popping an empty stack is underflow — return None.
After push(1), push(2), pop() returns 2 and leaves 1 on top.`,
    starterCode: `${STACK}
    def is_empty(self) -> bool:
        return self.top == -1

    def push(self, item: int | str) -> bool:
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def pop(self) -> int | str | None:
        pass
`,
    tests: `
def __t_underflow():
    s = Stack(2)
    assert s.pop() is None
    assert s.top == -1

__check("pop on empty returns None", __t_underflow)

def __t_lifo():
    s = Stack(3)
    s.push("A")
    s.push("B")
    assert s.pop() == "B"
    assert s.top == 0 and s.data[0] == "A"
    assert s.data[1] is None

__check("pop returns the most recent push", __t_lifo)

def __t_empty_again():
    s = Stack(2)
    s.push(9)
    assert s.pop() == 9
    assert s.top == -1
    assert s.data[0] is None

__check("popping the last item leaves the stack empty", __t_empty_again)
`
  },
  {
    id: 'st-peek',
    title: '5. Peek',
    prompt: `peek() returns the top item without removing it.

If the stack is empty, return None.
Otherwise return data[top] and leave top unchanged.`,
    starterCode: `${STACK}
    def is_empty(self) -> bool:
        return self.top == -1

    def push(self, item: int | str) -> bool:
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def peek(self) -> int | str | None:
        pass
`,
    tests: `
def __t_empty():
    assert Stack(2).peek() is None

__check("peek on empty returns None", __t_empty)

def __t_top():
    s = Stack(3)
    s.push("A")
    s.push("B")
    assert s.peek() == "B"
    assert s.top == 1 and s.data[1] == "B"

__check("peek reads the top without removing it", __t_top)
`
  },
  {
    id: 'st-reverse',
    title: '6. Reverse with a stack',
    prompt: `reversed_text(text) returns the characters of text in reverse order, as a string.

Use a Stack. Push every character, then pop until the stack is empty, building the result.
Do not use slicing such as text[::-1] or the built-in reversed.

"cat" pushes c, a, t. Popping gives t, then a, then c, so the result is "tac".
"" returns "".`,
    starterCode: `${STACK}
    def is_empty(self) -> bool:
        return self.top == -1

    def is_full(self) -> bool:
        return self.top == len(self.data) - 1

    def push(self, item: int | str) -> bool:
        if self.is_full():
            return False
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def pop(self) -> int | str | None:
        if self.is_empty():
            return None
        item = self.data[self.top]
        self.data[self.top] = None
        self.top = self.top - 1
        return item

def reversed_text(text: str) -> str:
    # use Stack(len(text) or 1) so there is always a capacity
    pass
`,
    tests: `
def __t_empty():
    assert reversed_text("") == ""

__check("empty string stays empty", __t_empty)

def __t_word():
    assert reversed_text("cat") == "tac"
    assert reversed_text("ab") == "ba"

__check("reverses by push then pop", __t_word)

def __t_longer():
    assert reversed_text("stack") == "kcats"

__check("works on a longer word", __t_longer)
`
  }
]
