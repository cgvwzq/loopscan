# Loopscan
Tool for monitoring shared event loops with Javascript

## Current support

* Renderer's Main Thread (with `postMessage`)
* Renderer's Main Thread (with timers)
* Host's I/O Thread (with `fetch` requests)
* Host's I/O Thread (with workers)

## Live demo
For a quick demo you simply visit this link and click "Start" :D

* http://vwzq.net/lab/loopscan/

## To Do

Add test case for the GPU process.
Create timer with `Worker` and `SharedArrayBuffer`.
