#fast.js

[![Build Status](https://travis-ci.org/ikarienator/fast.js.png?branch=master)](https://travis-ci.org/ikarienator/fast.js)

A simple, tested javascript algorithm library for node.js and browser.
This project is current under development.

## Current Progress
### General Algorithms
- Sequence Algorithms
    - Longest Increasing Subsequence
    - Longest Common Substring using DP(O(n^2))
    - Longest Common Subsequence using DP(O(n^2))
    - KMP Matching
### General Data Structures
- Ordered Dictionaries
    - Red-Black Tree
- Heaps
    - Binary Heap
- Disjoint Set
### Numeric Algorithms
- FFT
### Simple Number Theory Algorithms
- Primality Test
- Greatest Common Divisor

## Wish List

### General Algorithms
- Sort and Select algorithms
    - Compare based stable sort algorithm
    - [In-place merge sort](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.22.5514&rep=rep1&type=pdf) 
    - Radix sort
    - Counting sort
    - Bucket sort
    - Quick partition and k-th selection
- By-value Hashing for Objects

### General Data Structures
- Linked List(Singly and Doubly)
- Ordered Dictionaries
    - Unbalanced BST
    - Splay Tree
    - AVL Tree
    - Skip List
    - Van Emde Boas Tree
- Heaps
    - Cartesian Tree
- Young Tableau

### Graph Theory
- Adjacency Matrix/Adjacency List
- Traversal
- Topological Sort
- Strongly Connected Components
- Minimum Spanning Trees (Kruskal and Prim)
- Shortest Paths
- Maximum Flow

### Numeric Algorithms
- Numeric Derivative
- Numeric Integral
- Cubic Polynomial Solver
- Polynomial Evaluation

### Simple Number Theory Algorithms
- Small Number Factoring
- Big Integer Arithmetics
- Extended GCD
- Continued Fraction / Diophantine approximation
- Pell's equation
- CRT Recovery
- Elliptic Curve Arithmetics

### Linear Algebra
- Vectors and Matrix
- Eigenvalue and Eigenvectors
- Gaussian Elimination

### Computational Geometry
- Intersection
- Spline interpolation
- Polygon
    - Area/Circumference
    - Intersect/Union
    - Hit test
    - Offset
- Voronoi Diagram / Delaunay Triangulation

## License (BSD)

Copyright (C) 2012 [Bei ZHANG](http://twbs.in/).

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
following conditions are met:

- Redistributions of source code must retain the above copyright notice, this list of conditions and the following
disclaimer.
- Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following
disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.