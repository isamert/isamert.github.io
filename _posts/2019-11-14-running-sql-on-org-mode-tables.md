---
layout: post
title:  "Running SQL on org-mode tables"
---

I was tracking some sleep related information about myself using org tables and I wanted to visualize them. I thought to myself, _I know R! Let's do all that stuff in R!_. Oh boy, I was wrong. I used R in the past for an undergraduate course and I wasn't heavily invested in taking notes at those times. (Now thanks to org-mode and zotero, I don't forget _anything_ anymore) I quickly gave up using R for manipulating the data but I was going to use it for plotting anyway. At that point I was about to give up, firstly because I didn't want to have an overly-complex solution for such a worthless thing and secondly I was extremely lazy.

Then I remembered about `sqldf`. It's an R package that manipulates R dataframes (basically tables, at least for our purposes in this post) using SQL. Behind the scenes it uses an SQL DB implementation for this. It handles all the dirty stuff for us; like creating tables, running the SQL and conversion between the formats. So I simply used `sqldf` and R's plot function to accomplish my goal (Yeah, `ob-R` package supports passing org tables to R code as variables). Then I thought it may be really nice to have an SQL backend for manipulating org tables. Because why not? Nearly every _table-like technology_ have some kind of SQL-like query language.

# Preparation
## R
You need to install R and `sqldf` package.

```sh
pacman -S r # use your package manager for installing R, this is just an example for Arch
```

Now you need to install `sqldf`. But before that I recommend adding something like this to your environment variables (probably using `~/.profile` file, you know what's best), otherwise you will need root privileges to install R packages.

```sh
export R_LIBS_USER="$HOME/.rlibs"
```

You also need to create that directory:

```sh
mkdir ~/.rlibs
# BTW, run this too while you are here:
echo 'options(repos = c(CRAN = "https://cran.rstudio.com"))' > ~/.Rprofile
```

Now open the R console.

```sh
R
```

And run this:

```r
install.packages("sqldf")
```

That's all for the R part.

## Emacs
Enable running R code.

```elisp
(org-babel-do-load-languages
 'org-babel-load-languages
 '((R . t)))
```

This is optional but for R syntax highlighting and stuff you may want to install `ess` package. I recommend installing it with `use-package`:

```elisp
(use-package ess :ensure t)
```

# Running SQL on org tables
Now you can simply do this:

```org
#+tblname: tbltest
| col_a | col_b |
|-------+-------|
|     1 |     2 |
|     1 |     4 |
|     1 |     6 |
|     2 |     7 |
|     2 |     8 |
|     2 |     9 |

#+begin_src R :colnames yes :var tbltest=tbltest
library(sqldf)
sqldf("SELECT col_a, AVG(col_b) FROM tbltest GROUP BY col_a")
#+end_src
```

And as the result, you get this:

```org
#+RESULTS:
| col_a | AVG(col_b) |
|-------+------------|
|     1 |          4 |
|     2 |          8 |
```

Nice! But we don't have SQL syntax highlighting. We can get over it by doing something like this:

```org
#+name: tbltest-sql
#+begin_src sql
SELECT col_a, AVG(col_b) FROM tbltest GROUP BY col_a
#+end_src

#+begin_src R :noweb yes :var tbltest=tbltest
library(sqldf)
sqldf("<<tbltest-sql>>")
#+end_src
```

Now we have a nice syntax highlighting for our SQL. But for this you need to have at least 2 different code blocks every time.

## Using SQL instead of table formulas
I found some obscure ways of doing this but here I present the most sane one:

Firstly you need to have a named src block that calls `sqldf` with given SQL code, somewhere in your org file. Putting it under some section with `:noexport:` tag might be good idea if you are willing to export the document:
```org
#+name: table-sql
#+begin_src R :var sql="" :colnames yes
library(sqldf)
sqldf(sql)
#+end_src
```

```org
#+tblname: sometbl
#+RESULTS: sometbl
| col_a | col_b | col_sum |
|-------+-------+---------|
|     1 |     2 |       3 |
|     1 |     4 |       5 |
|     1 |     6 |       7 |
|     2 |     7 |       9 |
|     2 |     8 |      10 |
|     2 |     9 |      11 |
#+NAME: sometbl
#+CALL: table-sql[:var sometbl=sometbl](sql="SELECT col_a, col_b, (col_a + col_b) as col_sum FROM sometbl")
```

When you `C-c C-c` on the `#+CALL` line, the table will be replaced with the result of given SQL.

I believe things can be simplified with _a little bit of_ elisp but it may not worth the effort, this seems already an OK solution for me.
