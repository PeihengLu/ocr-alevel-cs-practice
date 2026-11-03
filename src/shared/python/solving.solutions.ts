/** Full editor contents that pass each problem-solving exercise. Used by the smoke test only. */
export const SOLVING_SOLUTIONS: Record<string, string> = {
  'walk-copy': `def copied(items):
    result = []
    for value in items:
        result.append(value)
    return result
`,
  'walk-total': `def total(items):
    total = 0
    for value in items:
        total = total + value
    return total
`,
  'walk-count': `def how_many(items):
    count = 0
    for value in items:
        count = count + 1
    return count
`,
  'walk-double': `def doubled(items):
    result = []
    for value in items:
        result.append(value * 2)
    return result
`,
  'ask-count': `def count_matches(items, target):
    count = 0
    for value in items:
        if value == target:
            count = count + 1
    return count
`,
  'ask-keep': `def positives(items):
    result = []
    for value in items:
        if value > 0:
            result.append(value)
    return result
`,
  'ask-found': `def contains(items, target):
    for value in items:
        if value == target:
            return True
    return False
`,
  'ask-all': `def all_positive(items):
    for value in items:
        if value <= 0:
            return False
    return True
`,
  'fact-last': `def last_item(items):
    if items == []:
        return None
    last = items[0]
    for value in items:
        last = value
    return last
`,
  'fact-biggest': `def biggest(items):
    if items == []:
        return None
    best = items[0]
    for value in items:
        if value > best:
            best = value
    return best
`,
  'fact-smallest': `def smallest(items):
    if items == []:
        return None
    best = items[0]
    for value in items:
        if value < best:
            best = value
    return best
`,
  'place-index': `def index_of(items, target):
    index = 0
    while index < len(items):
        if items[index] == target:
            return index
        index = index + 1
    return None
`,
  'place-pair': `def has_pair(items):
    index = 0
    while index + 1 < len(items):
        if items[index] == items[index + 1]:
            return True
        index = index + 1
    return False
`,
  'place-sums': `def neighbor_sums(items):
    result = []
    index = 0
    while index + 1 < len(items):
        result.append(items[index] + items[index + 1])
        index = index + 1
    return result
`,
  'text-count': `def count_letter(text, letter):
    count = 0
    for ch in text:
        if ch == letter:
            count = count + 1
    return count
`,
  'text-digits': `def digits_in(text):
    result = ""
    for ch in text:
        if ch in "0123456789":
            result = result + ch
    return result
`,
  'text-double': `def has_double_letter(text):
    index = 0
    while index + 1 < len(text):
        if text[index] == text[index + 1]:
            return True
        index = index + 1
    return False
`,
  'text-long': `def first_long_word(words, n):
    for word in words:
        if len(word) > n:
            return word
    return None
`,
  'until-countdown': `def countdown(n):
    if n < 1:
        return []
    result = []
    while n > 0:
        result.append(n)
        n = n - 1
    return result
`,
  'until-sum': `def sum_to(n):
    total = 0
    k = 1
    while k <= n:
        total = total + k
        k = k + 1
    return total
`,
  'until-steps': `def steps_to_one(n):
    count = 0
    while n > 1:
        n = n // 2
        count = count + 1
    return count
`,
  'nest-products': `def products(left, right):
    result = []
    for a in left:
        for b in right:
            result.append(a * b)
    return result
`,
  'nest-shared': `def shares_value(left, right):
    for a in left:
        for b in right:
            if a == b:
                return True
    return False
`,
  'nest-letters': `def count_in_words(words, letter):
    count = 0
    for word in words:
        for ch in word:
            if ch == letter:
                count = count + 1
    return count
`
}
