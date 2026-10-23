import { SeedSubject } from './types';

const G = 'Mobile & Python';

export const python: SeedSubject[] = [
  {
    slug: 'python', name: 'Core Python', icon: 'Code2', accent: '#facc15', group: G,
    description: 'The data model, generators, decorators and the concurrency story behind the GIL.',
    topics: [
      {
        slug: 'python-core', title: 'Data Model, Iteration & the GIL', minutes: 6,
        summary: 'Mutability, generators and how Python really runs threads.',
        doc: `
## Mutable and immutable

Lists, dicts and sets are **mutable**. Tuples, strings and numbers are **immutable**. Mutable default arguments are a classic trap because the default is created once.

## Generators

A function with **yield** returns a lazy iterator. It produces one value at a time, so you can process a huge file with tiny memory.

~~~python
def read_lines(path):
    with open(path) as f:
        for line in f:
            yield line.strip()

# memory stays flat even for a 10 GB file
total = sum(1 for line in read_lines('big.log') if 'ERROR' in line)
~~~

## The GIL

CPython has a Global Interpreter Lock, so only one thread runs Python bytecode at a time. Threads still help for I/O. For CPU work use **multiprocessing** or native extensions.
`,
        questions: [
          { d: 'beginner', q: `What is the difference between a list and a tuple?`,
            a: `A list is mutable, so you can add, remove and change items. A tuple is immutable and can be used as a dictionary key or set member when its items are hashable. Tuples signal fixed records and are slightly lighter.`,
            t: `Lists change, tuples do not.` },
          { d: 'intermediate', q: `Why use a generator instead of building a list?`,
            a: `A generator produces items on demand, so memory use stays constant regardless of input size, and the first result arrives immediately. A list builds everything up front.`,
            code: `squares = (n * n for n in range(10_000_000))  # lazy
first = next(squares)`, lang: 'python',
            t: `Lazy evaluation saves memory.` },
          { d: 'senior', q: `What is the GIL and how do you work around it?`,
            a: `The GIL lets only one thread execute Python bytecode at a time in CPython, which protects interpreter internals. I/O bound work still benefits from threads or asyncio because the lock is released while waiting. For CPU bound work use multiprocessing, a process pool, or libraries such as NumPy that run in C.`,
            t: `Threads for I/O, processes for CPU.` },
        ],
      },
      {
        slug: 'python-oop-decorators', title: 'OOP, Decorators & MRO', minutes: 6,
        summary: 'Write reusable behaviour with decorators and understand method resolution.',
        doc: `
## Decorators

A decorator is a function that takes a function and returns a new one. Use it for logging, timing, caching and access checks. Always apply **functools.wraps** so the wrapped function keeps its name and docstring.

~~~python
import time
from functools import wraps

def timed(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(fn.__name__, time.perf_counter() - start)
        return result
    return wrapper

@timed
def work(n):
    return sum(range(n))
~~~

## Method resolution order

With multiple inheritance, Python searches classes in the **C3 linearisation** order. Inspect it with the __mro__ attribute. The super call follows that same order.
`,
        questions: [
          { d: 'beginner', q: `What do self and __init__ do in a Python class?`,
            a: `__init__ is the initialiser that runs when you create an object and sets up its attributes. self is the first parameter of an instance method and refers to the object the method is called on.`,
            t: `__init__ sets up, self is the instance.` },
          { d: 'intermediate', q: `Write a timing decorator and explain functools.wraps.`,
            a: `The decorator wraps the function, measures time around the call and returns the result. functools.wraps copies the original name, docstring and metadata to the wrapper so debugging and introspection still work.`,
            code: `from functools import wraps
import time

def timed(fn):
    @wraps(fn)
    def wrapper(*a, **kw):
        t = time.perf_counter()
        try:
            return fn(*a, **kw)
        finally:
            print(fn.__name__, time.perf_counter() - t)
    return wrapper`, lang: 'python',
            t: `Decorators wrap behaviour, wraps keeps metadata.` },
          { d: 'senior', q: `How does Python resolve methods with multiple inheritance?`,
            a: `It uses C3 linearisation to build a consistent order that keeps each class before its parents and preserves the order of bases. The result is stored in the MRO, and super follows it, which is how cooperative multiple inheritance works. If no consistent order exists, Python raises a TypeError.`,
            code: `class A: pass
class B(A): pass
class C(A): pass
class D(B, C): pass
print(D.__mro__)  # D, B, C, A, object`, lang: 'python',
            t: `MRO is a consistent parents-after-children order.` },
        ],
      },
    ],
  },
  {
    slug: 'flask-django', name: 'Flask & Django', icon: 'FlaskConical', accent: '#f97316', group: G,
    description: 'Micro-framework thinking with Flask, plus the Django ORM and REST Framework.',
    topics: [
      {
        slug: 'flask-basics', title: 'Flask Routing, Blueprints & Contexts', minutes: 6,
        summary: 'Structure a Flask app with the factory pattern and understand request context.',
        doc: `
## A micro-framework

Flask gives you routing, request handling and templating, and leaves everything else, such as the database layer, to extensions. That freedom is why structure matters.

## App factory and blueprints

Build the app inside a function so you can create separate instances for testing. Group routes in **blueprints**.

~~~python
from flask import Flask, Blueprint, jsonify

api = Blueprint('api', __name__, url_prefix='/api')

@api.get('/health')
def health():
    return jsonify(status='ok')

def create_app(config=None):
    app = Flask(__name__)
    app.config.from_mapping(config or {})
    app.register_blueprint(api)
    return app
~~~

## Contexts

The **application context** holds app level data like config. The **request context** holds the current request. The objects request and g only work while a context is active.
`,
        questions: [
          { d: 'beginner', q: `What does it mean that Flask is a micro-framework?`,
            a: `It ships a small core with routing, request and response handling and templates. Choices such as database access, forms and authentication come from extensions you add, so the framework does not force a structure.`,
            t: `Small core, extensions for the rest.` },
          { d: 'intermediate', q: `Why use the application factory pattern with blueprints?`,
            a: `A factory creates a fresh configured app per call, which makes testing and multiple configurations simple and avoids circular imports. Blueprints group related routes into modules that you register on the app.`,
            code: `def create_app():
    app = Flask(__name__)
    app.register_blueprint(api)
    return app`, lang: 'python',
            t: `Factory plus blueprints equals testable, modular apps.` },
          { d: 'senior', q: `What is the difference between the application context and the request context?`,
            a: `The request context exists for one incoming request and exposes request and session. The application context exposes current_app and g and can exist without a request, for example in CLI commands and background jobs. Flask pushes both automatically for requests, and you push the app context manually elsewhere.`,
            code: `with app.app_context():
    db.create_all()  # needs current_app, no request`, lang: 'python',
            t: `Request context is per request, app context is per app.` },
        ],
      },
      {
        slug: 'flask-production', title: 'Flask APIs in Production', minutes: 6,
        summary: 'Return JSON, handle errors cleanly and serve with Gunicorn and Nginx.',
        doc: `
## Clean JSON errors

Register error handlers so every failure returns JSON with a proper status code.

~~~python
from flask import jsonify
from werkzeug.exceptions import HTTPException

@app.errorhandler(HTTPException)
def handle_http(err):
    return jsonify(error=err.name, message=err.description), err.code
~~~

## Serving for real

The built in server is for development. In production run **Gunicorn** with several workers and put **Nginx** in front for TLS and static files.

~~~bash
# four workers, listening on a local port
gunicorn "app:create_app()" --workers 4 --bind 127.0.0.1:8000
~~~

> A common starting point for workers is two times the CPU cores plus one.
`,
        questions: [
          { d: 'beginner', q: `How do you return JSON from a Flask route?`,
            a: `Return a dict or use jsonify. Flask sets the Content-Type to application/json. You can also return a tuple with a status code.`,
            code: `@app.get('/ping')
def ping():
    return {'ok': True}, 200`, lang: 'python',
            t: `Return a dict or jsonify, add a status code.` },
          { d: 'intermediate', q: `How do you centralise error handling in a Flask API?`,
            a: `Register errorhandler functions for HTTP exceptions and for your own exception classes. Each handler returns a JSON body and a status code, so clients always get a consistent shape.`,
            code: `class NotFound(Exception): status = 404

@app.errorhandler(NotFound)
def nf(e):
    return {'error': 'not_found'}, e.status`, lang: 'python',
            t: `One handler per error type, one JSON shape.` },
          { d: 'senior', q: `How do you deploy Flask in production?`,
            a: `Run it under a WSGI server such as Gunicorn with several workers, behind Nginx that terminates TLS, serves static files and proxies the rest. Use environment based configuration, structured logging, health checks and a process supervisor or container orchestrator for restarts.`,
            cmd: `gunicorn "app:create_app()" --workers 4 --bind 0.0.0.0:8000
>> [INFO] Listening at: http://0.0.0.0:8000`,
            t: `Gunicorn behind Nginx, never the dev server.` },
        ],
      },
      {
        slug: 'django-orm-drf', title: 'Django ORM & REST Framework', minutes: 6,
        summary: 'Query efficiently with the ORM and expose it through serializers and viewsets.',
        doc: `
## The Django ORM

Models map to tables and QuerySets are lazy: the query runs only when you read the results. The famous trap is the **N+1 query problem**, where looping over rows triggers one extra query per row.

~~~python
# N+1: one query for books, then one per author
for book in Book.objects.all():
    print(book.author.name)

# fixed: one JOIN query
for book in Book.objects.select_related('author'):
    print(book.author.name)
~~~

Use **select_related** for single valued relations and **prefetch_related** for many valued ones.

## Django REST Framework

A **serializer** converts model instances to JSON and validates input. A **ViewSet** plus a router gives you full CRUD in a few lines.

~~~python
class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.select_related('author')
    serializer_class = BookSerializer
~~~
`,
        questions: [
          { d: 'intermediate', q: `What is the N+1 problem in the Django ORM and how do you fix it?`,
            a: `Looping over a QuerySet and touching a related object runs one extra query for every row. Fix it with select_related, which uses a SQL join for foreign keys, or prefetch_related, which runs one extra query and joins in Python for many to many and reverse relations.`,
            code: `Book.objects.select_related('author')
Author.objects.prefetch_related('books')`, lang: 'python',
            t: `Fetch relations up front, not inside the loop.` },
          { d: 'senior', q: `What does a DRF serializer do, and how is a ViewSet different from an APIView?`,
            a: `A serializer converts between model instances and primitive data, and validates incoming data. An APIView gives you handlers like get and post that you write yourself. A ViewSet groups related actions such as list, create and retrieve, and a router builds the URLs automatically.`,
            t: `Serializers shape data, ViewSets plus routers cut boilerplate.` },
        ],
      },
    ],
  },
];
