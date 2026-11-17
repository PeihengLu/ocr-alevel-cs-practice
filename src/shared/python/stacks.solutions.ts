/** Full editor contents that pass each stack exercise. Used by the smoke test only. */
export const STACK_SOLUTIONS: Record<string, string> = {
  'st-create': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1
`,
  'st-empty-full': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1

    def is_empty(self):
        return self.top == -1

    def is_full(self):
        return self.top == len(self.data) - 1
`,
  'st-push': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1

    def is_full(self):
        return self.top == len(self.data) - 1

    def push(self, item):
        if self.is_full():
            return False
        self.top = self.top + 1
        self.data[self.top] = item
        return True
`,
  'st-pop': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1

    def is_empty(self):
        return self.top == -1

    def push(self, item):
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def pop(self):
        if self.is_empty():
            return None
        item = self.data[self.top]
        self.data[self.top] = None
        self.top = self.top - 1
        return item
`,
  'st-peek': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1

    def is_empty(self):
        return self.top == -1

    def push(self, item):
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def peek(self):
        if self.is_empty():
            return None
        return self.data[self.top]
`,
  'st-reverse': `class Stack:
    def __init__(self, capacity):
        self.data = [None] * capacity
        self.top = -1

    def is_empty(self):
        return self.top == -1

    def is_full(self):
        return self.top == len(self.data) - 1

    def push(self, item):
        if self.is_full():
            return False
        self.top = self.top + 1
        self.data[self.top] = item
        return True

    def pop(self):
        if self.is_empty():
            return None
        item = self.data[self.top]
        self.data[self.top] = None
        self.top = self.top - 1
        return item

def reversed_text(text):
    stack = Stack(len(text) or 1)
    for ch in text:
        stack.push(ch)
    result = ""
    while not stack.is_empty():
        result = result + stack.pop()
    return result
`
}
