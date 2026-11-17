/** Full editor contents that pass each graph exercise. Used by the smoke test only. */
export const GRAPH_SOLUTIONS: Record<string, string> = {
  'gr-create': `def create(vertices):
    return {vertex: [] for vertex in vertices}
`,
  'gr-add-undirected': `def add_edge(graph, a, b):
    if b not in graph[a]:
        graph[a].append(b)
    if a not in graph[b]:
        graph[b].append(a)
`,
  'gr-add-directed': `def add_arc(graph, a, b):
    if b not in graph[a]:
        graph[a].append(b)
`,
  'gr-remove-edge': `def remove_edge(graph, a, b, directed):
    if b in graph[a]:
        graph[a].remove(b)
    if not directed and a in graph[b]:
        graph[b].remove(a)
`,
  'gr-remove-vertex': `def remove_vertex(graph, vertex):
    del graph[vertex]
    for neighbours in graph.values():
        if vertex in neighbours:
            neighbours.remove(vertex)
`,
  'gr-neighbours': `def neighbours(graph, vertex):
    return list(graph[vertex])

def degree(graph, vertex):
    return len(graph[vertex])
`,
  'gr-bfs': `def breadth_first(graph, start):
    visited = {start}
    waiting = [start]
    order = []
    while waiting:
        vertex = waiting.pop(0)
        order.append(vertex)
        for neighbour in graph[vertex]:
            if neighbour not in visited:
                visited.add(neighbour)
                waiting.append(neighbour)
    return order
`,
  'gr-dfs': `def depth_first(graph, start):
    visited = set()
    order = []

    def visit(vertex):
        visited.add(vertex)
        order.append(vertex)
        for neighbour in graph[vertex]:
            if neighbour not in visited:
                visit(neighbour)

    visit(start)
    return order
`
}
