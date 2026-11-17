/**
 * Exercises for the Graphs chapter, including BFS and DFS traversal.
 */

import type { PythonExercise } from './linkedList.ts'

const WORKED = `
def __worked():
    # A —— B —— D
    # |    |
    # C —— E
    return {
        "A": ["B", "C"],
        "B": ["A", "D", "E"],
        "C": ["A", "E"],
        "D": ["B"],
        "E": ["B", "C"],
    }
`

export const GRAPH_EXERCISES: PythonExercise[] = [
  {
    id: 'gr-create',
    title: '1. Create an adjacency list',
    prompt: `create(vertices) returns an adjacency-list graph: a dictionary that maps each vertex to an empty neighbour list.

create(["A", "B", "C"]) returns {"A": [], "B": [], "C": []}.`,
    starterCode: `def create(vertices):
    pass
`,
    tests: `
def __t_empty_lists():
    g = create(["A", "B", "C"])
    assert g == {"A": [], "B": [], "C": []}

__check("each vertex starts with an empty list", __t_empty_lists)

def __t_independent():
    g = create(["X", "Y"])
    g["X"].append("Y")
    assert g["Y"] == [], "each vertex needs its own list object"

__check("neighbour lists are separate objects", __t_independent)
`
  },
  {
    id: 'gr-add-undirected',
    title: '2. Add an undirected edge',
    prompt: `add_edge(graph, a, b) adds an undirected edge between a and b.

Append b to a's list and a to b's list. Do not add a neighbour that is already present.

An undirected edge is a route both ways, so both lists change.`,
    starterCode: `def add_edge(graph, a, b):
    pass
`,
    tests: `
def __t_both():
    g = {"A": [], "B": [], "C": []}
    add_edge(g, "A", "B")
    assert "B" in g["A"] and "A" in g["B"]
    assert g["C"] == []

__check("stores the edge both ways", __t_both)

def __t_once():
    g = {"A": [], "B": []}
    add_edge(g, "A", "B")
    add_edge(g, "A", "B")
    assert g["A"] == ["B"] and g["B"] == ["A"]

__check("does not duplicate an existing neighbour", __t_once)
`
  },
  {
    id: 'gr-add-directed',
    title: '3. Add a directed edge',
    prompt: `add_arc(graph, a, b) adds a directed edge from a to b only.

Append b to a's list if it is not already there. Leave b's list unchanged.

"A": ["B"] means travel from A to B, and says nothing about B to A.`,
    starterCode: `def add_arc(graph, a, b):
    pass
`,
    tests: `
def __t_one_way():
    g = {"A": [], "B": [], "C": []}
    add_arc(g, "A", "B")
    assert g["A"] == ["B"]
    assert g["B"] == []

__check("stores the arc in one direction only", __t_one_way)

def __t_once():
    g = {"A": [], "B": []}
    add_arc(g, "A", "B")
    add_arc(g, "A", "B")
    assert g["A"] == ["B"]

__check("does not duplicate an existing neighbour", __t_once)
`
  },
  {
    id: 'gr-remove-edge',
    title: '4. Remove an edge',
    prompt: `remove_edge(graph, a, b, directed) deletes an edge.

Remove b from a's list if present.
If directed is False, also remove a from b's list.
If directed is True, change only a's list.`,
    starterCode: `def remove_edge(graph, a, b, directed):
    pass
`,
    tests: `
def __t_undirected():
    g = {"A": ["B", "C"], "B": ["A"], "C": ["A"]}
    remove_edge(g, "A", "B", False)
    assert g["A"] == ["C"] and g["B"] == [] and g["C"] == ["A"]

__check("undirected remove updates both lists", __t_undirected)

def __t_directed():
    g = {"A": ["B"], "B": ["A"]}
    remove_edge(g, "A", "B", True)
    assert g["A"] == [] and g["B"] == ["A"]

__check("directed remove changes only the from-list", __t_directed)
`
  },
  {
    id: 'gr-remove-vertex',
    title: '5. Remove a vertex',
    prompt: `remove_vertex(graph, vertex) deletes a vertex and every edge that named it.

1. Delete that vertex's own list from the dictionary.
2. Remove the vertex from every remaining neighbour list.`,
    starterCode: `def remove_vertex(graph, vertex):
    pass
`,
    tests: `${WORKED}
def __t_remove_e():
    g = __worked()
    remove_vertex(g, "E")
    assert "E" not in g
    assert g["B"] == ["A", "D"]
    assert g["C"] == ["A"]
    assert g["A"] == ["B", "C"]
    assert g["D"] == ["B"]

__check("deletes the vertex and all references to it", __t_remove_e)
`
  },
  {
    id: 'gr-neighbours',
    title: '6. Neighbours and degree',
    prompt: `neighbours(graph, vertex) returns a new list of that vertex's neighbours, in the same order as stored.
degree(graph, vertex) returns how many edges touch the vertex — the length of its neighbour list.

On an undirected graph, degree is the number of incident edges.`,
    starterCode: `def neighbours(graph, vertex):
    pass

def degree(graph, vertex):
    pass
`,
    tests: `${WORKED}
def __t_neighbours():
    g = __worked()
    assert neighbours(g, "B") == ["A", "D", "E"]
    out = neighbours(g, "B")
    out.append("Z")
    assert g["B"] == ["A", "D", "E"], "return a new list, leave the graph alone"

__check("returns a copy of the neighbour list", __t_neighbours)

def __t_degree():
    g = __worked()
    assert degree(g, "A") == 2
    assert degree(g, "B") == 3
    assert degree(g, "D") == 1

__check("degree is the length of the neighbour list", __t_degree)
`
  },
  {
    id: 'gr-bfs',
    title: '7. Breadth-first traversal',
    prompt: `breadth_first(graph, start) visits vertices level by level from start and returns the visit order.

Use a list as a queue (append / pop(0)) and a visited set:
1. Mark start visited and enqueue it.
2. While the queue is not empty, dequeue a vertex, record it, then enqueue each neighbour that is not yet visited (mark visited when enqueued).

Neighbours are already stored in alphabetical order on the worked graph.
From A the order is A, B, C, D, E.`,
    starterCode: `def breadth_first(graph, start):
    pass
`,
    tests: `${WORKED}
def __t_order():
    assert breadth_first(__worked(), "A") == ["A", "B", "C", "D", "E"]

__check("BFS from A is A, B, C, D, E", __t_order)

def __t_from_d():
    assert breadth_first(__worked(), "D") == ["D", "B", "A", "E", "C"]

__check("BFS from D follows neighbours in list order", __t_from_d)
`
  },
  {
    id: 'gr-dfs',
    title: '8. Depth-first traversal',
    prompt: `depth_first(graph, start) follows one path as far as it can, then backtracks. Return the visit order.

A common pattern is a recursive helper with a visited set:
1. Mark the vertex visited and record it.
2. Recurse on each neighbour that is not yet visited.

From A on the worked graph, the first neighbour is B, then D, then back to B for E, then C.
Order: A, B, D, E, C.`,
    starterCode: `def depth_first(graph, start):
    pass
`,
    tests: `${WORKED}
def __t_order():
    assert depth_first(__worked(), "A") == ["A", "B", "D", "E", "C"]

__check("DFS from A is A, B, D, E, C", __t_order)

def __t_from_c():
    assert depth_first(__worked(), "C") == ["C", "A", "B", "D", "E"]

__check("DFS from C follows the first unused neighbour each time", __t_from_c)
`
  }
]
