---
layout: post
title:  "Functional programming in C++"
---

* TOC
{:toc}

C++ enables you to do nearly everything with every possible paradigm. I actually consider it as a huge mess or maybe I’m the one that can not comprehend that much stuff. Considering C++ is made by people smarter than me, probably the latter is true.

So trying to use C++ as a purely functional programming language is probably possible but pointless in all cases except having some fun. More acceptable strategy may be using it as functional but not so pure language like Scala(or something like that). But then the question arises, why not use a language that is designed for that from scratch? Many answers can be given to this question but the most obvious ones goes like this:

-   You hate C++ but you need to write some C++.
-   You love C++ and looking for better paradigms to use in your programming.
-   You are neutral towards C++ and too lazy to learn another language from scratch, so you decided to go with C++. But you are not that lazy to learn a new paradigm.
-   Other combinations involving love-hate relationship with C++.

There are a lot of tutorials on this subject but they sometimes go too extreme or they are too specific. I’ll try to give you a general idea about how functional programming can be done using C++. These things generally dependent on new C++ features so I’ll put an indicator to everything that shows which feature aims which version of C++. Of course it’s probably possible to implement some of those features for earlier versions but I’ll just stick with the easiest and most recent implementations. And if some feature takes too much to implement, I’m not even going to mention it. Also, I’m not advocating usage of persistent (immutable) data structures because it’s either cumbersome to use them or they are inefficient. At the end of the day we are using C++ and lets keep it multi-paradigm. Think this tutorial as “zero-cost paradigm changes that you can apply to your daily C++ programming”.

# First things
## Use auto at all costs C++11
`auto` is just great. It makes your code faster and shorter. Consider this example (I took this example from Effective Modern C++ by Scott Meyers):

```cpp
std::unordered_map<std::string, int> m;
// ...
for (const std::pair<std::string, int>& p : m) {
   // ...
}
```

The problem with this code is that `std::pair<std::string, int>` is not the type of an element in a `std::unordered_map<std::string, int>`. Its actually `std::pair<const std::string, int>`. So in each iteration, this type conversion creates some overhead. Solution is easy and elegant. Just use auto:
```cpp
std::unordered_map<std::string, int> m;
// ...
for (const auto& p : m) {
   // ...
}
```

Not only we get rid of the overhead, we also have a shorter code. And considering we will use a lot of types involving templates and stuff, auto will save us from a lot of typing.

## Try not to deal with manual memory management C++11
Another core thing about functional programming is that you just tell computer what to do, not how to do it. So do not deal with the memory management manually, try to leave this job to compiler.
– Just use stack allocated objects instead of heap allocated objects as much as you can(See [this](https://stackoverflow.com/questions/6500313/why-should-c-programmers-minimize-use-of-new) Q&A for more information/explanation).
– If you need a pointer for real, use smart pointers.
– Use move semantics.
[Here](http://klmr.me/slides/modern-cpp/#1) is a great slide about what you need to do in nutshell.

# Concepts/Patterns
## Higher order functions
This is the fundamental idea of functional programming, passing functions as arguments to other functions, returning functions from functions. Before C++11 you could achieve such things by using function pointers or maybe using call operator(function objects). But now we have `std::function` and lambdas. Consider this code that shouts a given string:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string str = "oh, hi mark";

    // Turn all chars to upper
    for (auto & c: str)
    c = toupper(c);

    // Add some exclamation marks
    str = str + "!!!";

    std::cout << str << std::endl;
}
```

Lets make this shouting a function so we can reuse it.

```cpp
#include <iostream>
#include <string>

std::string shout(std::string str) {
    for (auto & c: str)
    c = toupper(c);

    str = str + "!!!";
    return str;
}

int main() {
    std::string str = "oh, hi mark";
    std::cout << shout(str) << std::endl;
    // Now we can shout as much as we want.
    std::cout << shout("you are tearing me apart Lisa") << std::endl;
}
```

Now think that we are going to use that `shout` function only in our `main` function. So it’s cumbersome to add it to header and stuff. Here lambdas are coming into play:

```cpp
#include <iostream>
#include <string>

int main() {
    auto shout = [](std::string str){
    for (auto & c: str)
        c = toupper(c);
    return str + "!!!!";
    };

    std::cout << shout("oh, hi mark") << std::endl;
    std::cout << shout("you are tearing me apart Lisa") << std::endl;
}
```

Problem solved. Lambdas are much more complex than this. They have a lot features.
If you don’t know about lambdas, check [this link](https://www.cprogramming.com/c++11/c++11-lambda-closures.html) out and also check [this link](https://www.cprogramming.com/c++11/c++11-lambda-closures.html) out to see what C++14 and 17 brings for lambdas. Especially *generic lambdas* which is a C++14 feature will help you a lot:

```cpp
auto genericAdd = [](auto x, auto y){ return x+y; };
std::cout << "4+12=" << genericAdd(4, 7) << std::endl;
std::cout << "4.0+12=" << genericAdd(4.0, 7) << std::endl;
std::cout << "\"Hello \"+\"world!\"=" <<
         genericAdd(std::string("Hello "), std::string("world!")) << std::endl;
```

One other benefit of using lambdas is that you can send them as parameters to `<algorithm>` functions. STL has some great functions which I’ll talk about later in this tutorial.

```cpp
#include <algorithm>

//...

std::vector<int> vec = {4, 8, 15, 16, 23, 42};

// Print the minimum element
auto min = std::min_element(vec.begin(), vec.end());
std::cout << min << std::endl;

// Print elements greater than 20
auto printIfGreaterThan20 = [](int elem){
    if (elem > 20)
        std::cout << elem << std::endl;
};

std::for_each(vec.begin(), vec.end(), printIfGreaterThan20);

// Find elements greater than 20 and copy them into vec2
std::vector<int> vec2;
std::copy_if(v.begin(), v.end(), std::back_inserter(vec2), [](int x){ return x > 20; });

// Doing the same thing again but instead of our comparator function, just use another STL function
std::vector<int> vec3;
std::copy_if(vec.begin(), vec.end(), std::back_inserter(vec3),
          std::bind(std::greater<int>(), std::placeholders::_1, 20));
```

I’ll talk about `std::bind` and placeholders in a bit. But [here](http://www.cplusplus.com/reference/algorithm/) is a complete list of `<algorithm>` functions.

## Partial Application and Currying
There is a function called `std::less(x,y)` which compares two comparable and returns true if `x<y` or false otherwise. You can use this function as your comparator function for sorting algorithms for example.

```cpp
    std::vector<int> vec = {42, 4, 15, 8, 23, 16};
    std::sort (vec.begin(), vec.end(), std::less<int>());
    for(auto i: vec)
        std::cout << i << ", ";
    // Prints 4, 8, 15, 16, 23, 42
```

What if you want to use `std::less` as comparison function for `std::remove_if`? Lets say we want to remove numbers lower than 22 from our list. Of course we can write a lambda function like this and use it as our predicate function:

```cpp
[](int x) {return x < 22;}
```

But instead of writing our function, we want to use `std::less`. If we look the signature of `std::remove_if`, it requires an `UnaryPredicate` but obviously `std::less` is a `BinaryPredicate`. What we need to do is partially apply 22 to `std::less`:
```cpp
using namespace std::placeholders;
//...
auto lowerThan22 = std::bind(std::less<int>(), _1, 22); // Partial application using std::bind
std::vector<int> vec = {4, 8, 15, 16, 23, 42};
vec.erase(std::remove_if(vec.begin(), vec.end(), lowerThan22), vec.end());
```

As you can see, using `std::bind` function we bind the second argument of `std::less` to 22. As first argument, we sent a placeholder `_1` which is actually just `std::placeholders::_1`. After partial application `std::less(x,y)` function turned into something like this: `std::less(x, 22)`. So we partially applied some argument to a binary function and it turned into an unary function. Now it only needs one argument to work.

However there is no out of the box support for currying and implementing it is not that easy. So I’ll just leave a great SO answer [here](https://stackoverflow.com/questions/152005/how-can-currying-be-done-in-c/26768388#26768388). You can learn what currying is and learn how can you implement it in C++11/14/17.

## Folding

Folding is reducing a some data structure to a single variable with a given operator. For more information, take a look at [here](https://en.m.wikipedia.org/wiki/Fold_(higher-order_function)). I’m going to inspect folding in 2 categories:

### 1. Folding STL containers
`std::accumulate` is the way. There are 2 definitions of `std::accumulate` which are:

-   `std::accumulate(first, last, initial_value)`
-   `std::accumulate(first, last, initial_value, binary_operator)`

First one uses `+` operator as default `binary_operator`. Look at these examples:

```cpp
std::vector<int> v = {1,2,3,4,5};

// Get sum of the vector:
int sum1 = std::accumulate(v.begin(), v.end(), 0); // 0 as initial value
// sum1 is 15

// Multiply every element by 2 while summing them
int sum2 = std::accumulate(v.begin(), v.end(), 10, [](int x, int y) { return x + (2*y) });
// sum2 is 40 (care the initial value)

// Again, you can use STL functions as BinaryOperator
int result = std::accumulate(v.begin(), v.end(), 50, std::minus<int>());
// result is 35 (care the initial value)

// Folding boolean values
std::vector<boolean> bs = {true, true, false, true};
bool allTrue = std::accumulate(bs.begin(), bs.end(), true, std::logical_and);
bool anyTrue = std::accumulate(bs.begin(), bs.end(), false, std::logical_or);
// Care that these last two doesn't do short-circutting

// These does short-circutting
bool allTrue = std::all_of(bs.begin(), vec.end(), [](bool x) { return x; } );
bool anyTrue = std::any_of(bs.begin(), vec.end(), [](bool x) { return x; } );
```

### 2. Folding arbitrary number of arguments
C++11 has a thing called *variadic templates* which enables you to do write such functions that can take arbitrary number of template parameters.

```cpp
// The `auto` usage here is a C++14 feature.
// You can define a template and make this base case for only one element
// and get the return type from template for making this function C++11 compatible.
auto sum() {
    return 0;
}

// Again, use `First` as return type instead of `auto` to make this C++11 compatible.
template<typename First, typename... Rest>
auto sum(First first, Rest... rest){
    return first + sum(rest...);
}

// Usage:
sum(1,2,3,4);
sum(42,13,26,38,11);
//...
```

So you can create functions that can take arbitrary number of arguments and fold them. What you need to do is just write your function in recursive way and define a base case(or other needed recursion rules). But even better, C++17 has variadic folds, which makes this process easier with handling the base case in itself.
```cpp
template<typename ...Args>
auto sum(Args ...args) {
    return (args + ... + 0);
}
```

[Here](https://eli.thegreenplace.net/2014/variadic-templates-in-c/) is a great tutorial about variadic templates of C++11.
[Here](http://en.cppreference.com/w/cpp/language/parameter_pack) you can learn more about parameter packs.

## Sum types (std::variant) C++17
Sum types are very cool and useful. Basically a sum type is just only one type out of a set of possible types. To be more concrete, I’ll give an example: Let’s say you have SoundFile, ImageFile and VideoFile. So a file object can be SoundFile **or** ImageFile **or** VideoFile. Defining your file object as a sum type of these types gives you a lot of flexibility and type safety. See this example:

```cpp
struct File { std::string path; };
struct SoundFile : File { };
struct ImageFile : File { };
struct VideoFile : File { };

int main() {
    std::variant<SoundFile, ImageFile, VideoFile> file;
    // file object can be one of these three

    file = ImageFile(); // Now file is ImageFile

    // To get the content of the variant
    ImageFile f2 = std::get<ImageFile>(file);
    SoundFile f2 = std::get<SoundFile>(file); // This line throws std::bad_variant_access, because file object contains ImageFile, not SoundFile
}
```

In practice, we don’t blindly try to get content of the variant. Better way to get the content is using a visitor and pattern match against all possible types. First we need to define a visitor and do the pattern matching using `std::visit`.

```cpp
    struct FileVisitor {
        void operator()(const SoundFile& if) const { std::cout << "A sound file!" << std::endl; }
        void operator()(const ImageFile& if) const { std::cout << "An image file!" << std::endl; }
        void operator()(const VideoFile& vf) const { std::cout << "A video file!" << std::endl; }

        void operator()(const auto& f) const { std::cout << "Something else?!?!" << std::endl; }
        // We know for sure that our file object either one of three types that we defined above.
        // But we may end up adding another type to our variant, something like TextFile, and we
        // may forget to update our visitor. In this case, this last pattern will match and save us.

        // There is also another use case for this auto capture. For example you may want to play
        // the sound of the file if it's a SoundFile otherwise you may want just display the file's
        // path. In this case you will only pattern match for SoundFile and the rest will be handled
        // by the auto capture.
    };

    // Now you can use std::visit
    std::visit(FileVisitor(), file);
```

The problem with this approach is that it cannot capture state. The better way is using lambdas:

```cpp
template<class... Ts> struct overloaded : Ts... { using Ts::operator()...; }:
template<class... Ts> overloaded(Ts...) -> overloaded<Ts...>;

std::visit(overloaded {
    [](const SoundFile& sf) { std::cout << "Playing the sound..." << ' '; },
    [](const auto& other) { std::cout << other.path << ;},
}, file);
```

Still a bit verbose but at least its in-place and more useful thanks to lambdas.

## Functors
Here I’m not talking about `function objects`, I’m talking about `Functors` as described [here](https://en.wikipedia.org/wiki/Functor). There are several libraries that provides some kind of Functor/Monad types but again I’ll just talk about the built-in functors that you can start using immediately.

In case you don’t know about functors; a functor is a mapping that preservers the structure between two categories. More concretely, functors gives you the ability to make some transformation on some structure without exposing its contents to the public. What I mean by “exposing its contents to the public” is iterating over the structure if it’s a container or dereferencing it if it’s a pointer etc.

For example, everytime you need to apply some function to a vector, you need to loop through it, apply the function to every individual element then put those elements back to a vector. Another example would be a pointer. Lets say you have a pointer to an int and a function that requires an int as input. To apply this function to your pointer, firstly you need to dereference it and then apply the function. Afterwards you need to wrap the result in a pointer again.

### STL Containers as Functors
Functors needs a some kind of a helper function to apply the transformation function to the structure. For STL containers, this helper function is `std::transform`.

```cpp
std::vector<int> xs = {1, 2, 3, 4};

std::vector<int> squared_xs;
std::transform(xs.begin(), xs.end(), std::back_inserter(squared_xs), [](int x){ return x^2; });
// squared_xs is now {1, 4, 9, 16}
```

We applied the lambda function to xs without exposing the inner data structure.

### std::optional as Functor (C++17)
`std::optional` is a type for representing situations that there can be a value or not. For example `std::optional<int> x` means that *x* can contain an integer or it may contain nothing at all. Of course one can use pointers for such situations but you don’t want to deal with memory allocation and other bad stuff that comes with pointers for this trivial problem. Check these links out to learn more use cases about `std::optional`: [link1](http://en.cppreference.com/w/cpp/utility/optional), [link2](https://stackoverflow.com/questions/16860960/how-should-one-use-stdoptional).

`std::optional` does not come with a helper transformation function. There is a very nice [proposal](http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/p0798r0.html) that I came across but I don’t know its current status. So lets just write our transformation function for `std::optional`, its fairly trivial to implement. To understand it, look at this pseudocode first:

```cpp
// We have an optional that wraps type T.
// We also have a function that takes a T and returns R.
// So what we want to do is somehow apply this function to optional<T>.
// To do that, we just extract the value from optinal and supply that
// value to the function. Then we wrap the result to optional.

optional<R> transform(optional<T> opt, (T -> R) func) {
    if (opt.has_value())
    return optional(func(opt.value()))
    else
    return optional_empty;
}
```

The C++ version with some simplifications:

```cpp
template <typename T, typename F>
auto transform(const std::optional<T>& opt, F&& f) -> std::optional<decltype(f(*opt))> {
    using ResultType = std::optional<decltype(f(*opt))>;
    return (opt) ? ResultType(f(*opt)) : std::nullopt;
}
```

Now we can take any function that has a type of `T -> R` and apply this function to our optional type using our transform function. Consider this:

```cpp
std::optional<int> x = 3;
auto plus_3 = [](int x){ return x + 3; };

auto y = transform(x, plus_3); // y is an optional<int> and has value of 6
auto z = transform(transform(y, plus_3), plus_3); // z is an optional<int> and has value of 12
```

So this is great, we can use functions with `std::optional` even though they do not know anything about `std::optional` with help of `transform` function.

### Pointers as Functors
Let’s say given a `std::unique_pointer<int>` you want to get `std::unique_pointer<std::string>` which represents the text version of that `int`. Assume that your conversion function has this signature: `std::string convert(int number)`. So again, you need the unpack the integer from `unique_pointer` and apply this function and wrap it into `unique_pointer` back. But as you know we can use functors to solve this unpacking problem. See this code:

```cpp
template<class T, class F>
auto transform(std::unique_ptr<T> opt, F&& f) -> std::unique_pointer<decltype(f(*opt))> {
    using ResultType = std::unique_ptr<decltype(f(*opt))>;
    return ResultType(f(*opt));
}
```

This is the transformation function for pointers. Notice the similarity with the optional transformation function. Dereferencing a pointer and getting the value of a optional has the same \* syntax by coincidence. Now we can do something like this:

```cpp
std::unique_pointer<int> number;
...
std:unique_pointer<std::string> result = transform(number, convert);
```

### Taking functors a bit further
As you may have noticed, functors does this: You have a variable of type `B<A>` and a function of type `C function(A)` (a function that takes `A` as argument and returns `C`) and you want to get `B<C>`. What functors does is handling all the unwrapping and wrapping for you.

But what if you have a variable of type `B<A>` and a function of type `B<C> function(A)` and you want to get `B`. A more concrete example would be this: You have a `std::optional<std::string>` and a function that converts the given string to corresponding integer. Assume the function returns an `std::optional<int>` instead of just straight int, because the conversion may fail and we want to handle everything properly. Again, what you need to do is get string value from our optional variable. So now you have a straight `std::string` and now you can apply the conversion function to that string. As what we did with functors, we can generalize this pattern into a function which handles the unpacking for us. This function is called `monadic bind` in functional programming. This could be an easy exercise.

