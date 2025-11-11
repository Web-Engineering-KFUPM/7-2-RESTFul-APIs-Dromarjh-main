# Lab - RESTful Web APIs (Node + Fetch)

## Overview of the Lab

In this lab, students will learn how to build RESTful Web APIs using
Node.js and Express, and how to consume these APIs from a front-end
using the Fetch API.\
Students will implement CRUD operations (Create, Read, Update, Delete)
and connect their backend to a MongoDB database to store and retrieve
data dynamically.

------------------------------------------------------------------------

> **Note:** Follow `app.jsx` to implement the lab. The file contains TODO blocks that describe exactly what to build.

## Reading Assignment

-   [7.3 Creating RESTful Web APIs
    (Node)](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/3)
-   [7.4 Using RESTful Web APIs with
    Fetch](https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/7/section/4)

------------------------------------------------------------------------

## Concepts Used in the Lab

### 1. What are RESTful Web APIs?

RESTful APIs are interfaces that follow Representational State Transfer
(REST) principles.\
They use HTTP methods to perform CRUD operations on resources,
identified by unique URLs.

**General Syntax:**

``` js
app.get('/api/resource', (req, res) => {
  res.send('data');
});
```

### 2. What are HTTP Request Verbs?

HTTP request methods (verbs) define the type of operation being
performed on a resource.

**General Syntax:**

``` js
fetch('/api/resource', { method: 'GET' });
```

### 3. Purpose of Each Request for CRUD Operations

  HTTP Verb    Operation   Description
  ------------ ----------- -----------------------
  **POST**     Create      Create a new resource
  **GET**      Read        Retrieve a resource
  **PUT**      Update      Update a resource
  **DELETE**   Delete      Delete a resource

### 4. How to Do CRUD Operations Using a Database

Databases like MongoDB are used to persist data. Mongoose (for Node.js)
provides functions to interact with collections and documents.

**General Syntax:**

``` js
Model.find();
Model.create();
Model.updateOne();
Model.deleteOne();
```

### 5. How to Get POST and PUT Data Using API

In Express, POST and PUT data are accessed from `req.body`. You must
enable JSON parsing using `app.use(express.json())`.

**General Syntax:**

``` js
app.post('/api/resource', (req, res) => {
  const data = req.body;
  res.json(data);
});
```

------------------------------------------------------------------------

## ✅ Checklist Before Submitting the Lab

-   [ ] MongoDB connection established before starting the server.
-   [ ] Schema and model created for the database collection.
-   [ ] CRUD routes implemented correctly (POST, GET, PUT, DELETE).
-   [ ] Tested all routes using Postman or the provided front-end.
-   [ ] Proper error handling and status codes used.
-   [ ] Code is clean, readable, and commented.
