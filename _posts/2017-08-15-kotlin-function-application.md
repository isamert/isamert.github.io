---
layout: post
title:  "Kotlin function application"
---

I often write some code like this:

```kotlin
val result = someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    ....

someFunction(result)
```

As you can see last line of the code is breaking the beautiful flow of chained functions. One can rewrite this as:

```kotlin
someFunction(someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    ....)
```

Which seems better to me but not as good as this:

```kotlin
someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    ....
    .apply(::someFunction)
```

I don’t know if there is a standard way of doing this but here is my solution:

```kotlin
infix fun <T, R> T.apply(func: (T) -> R): R = func(this)
```

So this extension function applies its object to the function that it took as an argument and returns the result of application. You can use it as an infix operator, if you want to:

```kotlin
someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    .... apply ::someFunction
```

You can even chain function applications:

```kotlin
someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    ....
    .apply(::fun1)
    .apply(::fun2)
    .apply(::fun3)
    .apply { fun4(it) }
```

Which is same as:

```kotlin
someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    .... apply ::fun1 apply ::fun2 apply ::fun3 apply { fun4(it) }
```

Also this code is equivalent of this one:

```kotlin
val result = someData.split(...)
    .map { ... }
    .filter { ... }
    .reduce { ... }
    ....

fun4(fun3(fun2(fun1(result))))
```
