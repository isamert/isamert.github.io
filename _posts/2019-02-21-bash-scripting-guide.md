---

title: Bash scripting guide
layout: post

---

* TOC
{:toc}

I've been writing some bash scripts lately and I've learned a lot. I must say that it's really fun to write bash scripts, every line of code feels hacky and no matter what I wrote, it felt bad which is kind of liberating. I found my real self in bash scripts. Here are some of the things that I find useful or/and important.

I'll be talking about `bash` specifically, but I lot of the features in here are implemented in very similar ways in other shells.

# shebangs
The most portable shebang for bash scripting is: `#!/usr/local/env bash`. It basically asks `env` to find `bash` and wherever it may be, run this script with it. Do not use `sh`, it may be linked to `bash` but most of the time this is not the case.

shebangs also let's you do some cool tricks:

## Running scripts with sudo
If you need to run some commands with root privileges in your script, it is generally advised to run your script using `sudo` instead of having a `sodo command ...` kind of line in the script. So to write such script, you need to check if you have root privileges or not. Instead of that, you can have this kind of shebang:

```bash
#!/bin/sudo /bin/bash
```

Now your script is guaranteed to be running with sudo, _kind of_. As I said using `#!/usr/local/env` to find the binary you want is the most reliable way of doing it. With this shebang, we got this problems: `sudo` or/and `bash` might not be in `/bin` directory. You might have tempted to do this then:

```bash
#!/usr/bin/env sudo bash
```

Which seems reasonable. We ask `env` to find `sudo` and we are calling it with bash argument and due to nature of shebangs, the script's path added to the end. So the final call that is produced by the shebang will be this:

```bash
/path/to/sudo bash /path/to/your/script
```

But unfortunately, this is not the case. Because `env` parses all arguments as a whole, it looks for an executable named `sudo bash` in your `$PATH`. But that is also easy to fix, just use `-S` option of `env` to be able to pass arguments in shebang lines:

```bash
#!/usr/bin/env -S sudo bash
```

I'm not entirely sure about this style of sudo calls. There may be implications that I'm missing but it worked out well for me.

## Running other programs with shebangs
This is not entirely related to bash scripting but it's worth mentioning. Check this out:

```bash
#!/usr/bin/env -S cat ${HOME}/.bashrc
```

This script directly calls `cat` with `${HOME}/.bashrc` argument. Instead of using `bash` to call `cat` program, we got rid of one level of indirection. (using `${HOME}` instead of `$HOME` is just an `env` restriction). This may seem silly, but I'm sure it has it's own use-cases.

# Primitives
Here are some basic tips that makes your code faster and easy to reason.

## `true` and `false`
- `true` and `false` are actual binaries that does nothing and returns `0` and `1` respectively as their exit code. If you pass a command to if clause, it checks the exit code of it and depending on that selects the right branch. So `0` exit code which means successful exit is considered as `true` and everything else is considered as false.

```bash
if true; then echo "hey, it's true!"; fi

# They are also helpful in context of functions:
function starts_with {
    case "$1" in
        "$2"*) true ;;
        *) false ;;
    esac
}

# prints yes
if starts_with "something" "some"; then echo "yes!"; else echo "no :("; fi
```

- But I should mention that `true` and `false` does not stop the function from flowing. In bash, last command call's exit code is returned as function's exit code. To stop the function and return true, just use `return`. `return` halts the function and returns `0` as the exit code. We can revise the function from above in that style:

```bash
function starts_with {
    case "$1" in
        "$2"*) return ;;
    esac

    false
}
```

- To exit early with a false value, just use `return something-not-zero`, like `return 255`.

## `[[ ]]` and `(( ))` instead of `[ ]`
- `[` is an actual binary. So it costs more to use it. `[[` is a bash built-in and has a lot of improvements over `[`.
- `((` is like `[[` but for arithmetic expressions only. You can compare variables and make some calculations within them directly.

```bash
echo "Enter a year:"
read year

if [[ -z $year ]]; then
    echo "Year cannot be empty."
elif (( ($year % 400) == 0 )) || (( ($year % 4 == 0) && ($year % 100 != 0) ))
    echo "A leap year!"
else
    echo "Not a leap year :("
fi
```

- See [this link](http://mywiki.wooledge.org/BashFAQ/031) for more information.

## `let` instead of `(( ))`
Another somewhat nicer alternative to `(( ))` is `let`. It's not an alternative for using inside if clauses but for assignments it requires less typing:

```bash
let l=33+9
```

# Variables
## `declare` and it's friends
`declare` is pretty useful built-in function. I'll go over some of it's capabilities and my take on usage but you can type `help declare` and see a very informative and short text about it.

- Using declare inside a function makes the variable local, meaning they do not interfere with global variables. A better alternative is just using `local` built-in which is more clear. If your intention is exact opposite, meaning you want to declare a global variable, use `-g` option with declare. (Actually just assigning something to a variable without `declare`/`local` keywords make them global. So you don't need something like this: `declare -g a=3` inside a function to make it global, `a=3` is enough. `-g` comes handy if you are using other options of `declare` and wanting to make the variable global)

```bash
greeting="hey"

function greet {
    local greeting="hi"

    echo "Your name:"
    read name

    echo "Local greeting:"
    echo "$greeting $name"
}

greet
echo "Global greeting:"
echo "$greeting $name"
```

  - As you may have noticed, `name` becomes a global variable. If you want to keep it in the scope of the function, add this line before `read name`: `local name`.
  - Also you can use the options that `declare` takes with `local`. (Yeah it's possible to do some stupid thing like: `local -g`)

- To declare a read-only variable, you can use `declare -r` or better, `readonly`.
- To export variables into environment you can use `declare -x` or better, `export`

## String manipulation
Here is a quick summary of string manipulation capabilities of bash: (Assume `string` is a pre-defined variable)
- `${#string}`     → returns the length of $string.
- `${string:4}`    → returns the substring starting at fourth character of $string.
- `${string:4:3}`  → returns the substring of length of three starting at fourth character of $string.
- `${string#asd}`  → Removes `asd` from beginning of $string (if it starts with `asd`).
- `${string##asd}` → Same as above.
The difference becomes apparent between `#` and `##` when you start using some globing operators. While `#` removes shortest match, `##` removes the longest match. Check this:

```bash
string="abcabcdefg"
x=${string#a*c}  # x is abcdefg
y=${string##a*c} # y is defg
```

- `${string%asd}`      → Removes `asd` from back of $string.
- `${string%%asd}`     → Same as above, but like in the case of `#` and `##`, `%` removes shortest match, `%%` removes longest match.
- `${string/asd/123}`  → Replaces first match of `asd` with `123`.
- `${string//asd/123}` → Replaces all matches of `asd` with `123`. Again you can use globing characters here.
- `${string/#asd/123}` → Replace `asd` if it's in front of the string with `123`.
- `${string/%asd/123}` → Replace `asd` if it's at the end of $string with `123`.

Also there is stuff for case manipulation. Given variable `EXAMPLE="An ExaMplE"`, observe these:
- `${EXAMPLE^}`  → `An ExaMplE`
- `${EXAMPLE^^}` → `AN EXAMPLE`
- `${EXAMPLE,}`  → `an ExaMplE`
- `${EXAMPLE,,}` → `an example`
- `${EXAMPLE~}`  → `An ExaMplE`
- `${EXAMPLE~~}` → `AN eXAmPLe`

- [Here](http://www.tldp.org/LDP/abs/html/string-manipulation.html) is a more complete reference with more examples.

## Regular expression matching
You can use `=~` operator to perform a regular expression match instead of simple globing:

```bash
# Check if input is hexadecimal:
if [[ $input =~ ^[[:xdigit:]]*$ ]]; then
    # do stuff with it
fi
```

## Default vaules
You can use `${VAR:-DEFAULT}` or `${VAR-DEFAULT}` syntax to define default variables. The first one outputs `DEFAULT` if the `$VAR` is empty or unset. Latter only outputs `DEFAULT` when `$VAR` is unset. A practical example of this would be:

```bash
echo "Your config directory is: ${XDG_CONFIG_HOME:-$HOME/.config}"
```

There is also a version of this which uses `=` instead of `-`. The difference is that it also sets the variable to default value so that you can use the variable afterwards without defining a default value everytime.

# Parameters
## shift
You can access to parameters using positional parameters: `$1, $2 ... $9, ${10}, ${11} ...`. `shift`, as the name suggests, shifts those parameters. So when you call `shift`, `$2` becomes `$1`, `$3` becomes `$2`... It becomes handy in loops or sometimes you just want to process first _N_ parameters and leave rest as is while passing them to another program.

```bash
# Removes given files if they are empty

while (( "$#" )); do
    if [[ -s $1 ]]; then
        echo "Can't remove."
    else
        rm $1
    fi

    shift
done
```

`shift` also can be called with a number argument, like `shift 3` which shifts parameters 3 times.

## Preserving
Say that we have a wrapper script/function that checks if `ripgrep` (rg) is installed and executes it with given parameters otherwise it calls `grep` with given parameters:

```bash
rg_path=$(which rg)
 if [ -x "$rg_path" ]; then
    rg "$@"
else
    grep "$@"
 fi
```

- `"$@"` is equivalent of doing `"$1" "$2" "$3" ...`. And it's the only thing that does that.
- `"$*"` concatenates parameters using `IFS` as separator. (If IFS is empty, which is the case in this script, it simply uses space as separator.)
- To learn more about special parameters, check [this](https://www.gnu.org/software/bash/manual/bash.html#Special-Parameters).

## Looping trough arguments
It's a pretty common task with pretty easy syntax:

```bash
for arg in "$@"; do
    echo "$arg"
done
```

Or better yet:

```bash
for arg; do
    echo "$arg"
done
```

# Subshells
The most common problem of using subshells is that subshells can not effect the parent shell's variables. For example:

```bash
echo "stuff" | read some_var
```

In this example, usage of `|` introduces a subshell and the `some_var` is defined in this subshell. Then that subshell is vanished when the execution of the line is over. So that you can not use `some_var` in rest of the script. There are a few ways to get around this issue. Most simple one being:

```bash
echo "stuff" | {
    read some_var
    echo "I can use $some_var"
}
```

Here `|` still introduces a subshell but we contiune to do our stuff in that subshell. But still you can't communicate with the parent shell, after the `{ ... }` is over `some_var` is not available for use. At this point you have two solutions: _here strings_ and _process substitutions_.

## Here strings
Contining the example above, we can do something like this:

```bash
read some_var <<< "stuff"
# or
read some_var <<< $(echo "stuff")
```

`<<<` redirects the string to stdin of the command. So that we didn't create a subshell and we can use `some_var` from now on in our script.

## Process substitution
A process substitution creates a temproary file with the given output and passes that temproary file to a command. For example:

```bash
read some_var < <(echo "stuff")
```

Here, the effect is same as with _here strings_ but what happens is a lot different. As you may already know `<` redirects given file to stdin of the command before it. `<(...)` simply creates a temproary file containing `...` and replaces itself with the path to that temproary file. To simplify, you can think that the command becomes: `read some_var < /dev/fd/some_number` after evaluating `<(echo "stuff")` part (`/dev/fd/...` is the path where temp file is created, and it contains `stuff`). Now `<` simply redirects the contents of the file to `read some_var` command.

# Functions
### Functions that accepts both arguments and stdin
Let's say that you want your function to accept data either as argument or from stdin. You can simply combine `${VAR:-DEFAULT}` syntax with redirecting operator and you will have this:

```bash
str=${*:-$(</dev/stdin)}
```

Now your function will concatenate your arguments and set it to `str` or if there are no arguments it'll read stdin and set it to str.

# Linting bash scripts
It's really hard to spot errors in your bash scripts because it's dynamic nature and when an error occurs bash doesn't really care about it and gives you as little information as possible. A great tool, called `shellcheck` addresses this shortcomings of bash. It's a great bash linter, that detects a lot of the common mistakes. It gives you nice advices that makes your code more portable/readable/safe. Just use it. (For Arch Linux users that do not want to install bunch of haskell-* packages as dependencies, there is also shellcheck-static package in aur, I recommend using that. For vim users I recommend using (ALE)[https://github.com/w0rp/ale] extension, it works out of the box with shellcheck.) For _emacs_ users, _Flycheck_ works out of the box with shellcheck.
