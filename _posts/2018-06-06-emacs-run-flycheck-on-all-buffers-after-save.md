---
layout: post
title:  "emacs – Run flycheck on all buffers after save"
---

*To just see the working solution, scroll down to The Result.*

Flycheck only runs on current buffer. If you make a change in a file that effects another file, buffer of the second file will not get notified and thus flycheck is not going to run on that buffer. So what we need to do is add an after save hook which runs flycheck on other buffers, but only on file buffers. We don’t want to run flycheck on temporary buffers or so. It seems simple but it took some time for me to get there, because I know too little about `elisp`.

First, we need a function that runs flycheck on given buffer. There is a function called `flycheck-buffer` but it only checks current buffer. But it turns out this is how elisp functions generally work and there is a way to get around that. Using `with-current-buffer buffer` function we can run any function on given buffer. `with-current-buffer` changes current buffer to given buffer, runs the function and restores current buffer to old one. So:

```lisp
(defun flycheck-buffer* (buffer)
  "Runs flycheck on given BUFFER."
  (with-current-buffer buffer
    (flycheck-buffer)))
```

Another thing we need is that a function that returns all buffers. It’s `buffer-list`. We need to remove temporary buffers and the current buffer from that list. Here it goes:

```lisp
(defun other-file-buffer-list nil
  "Returns the list of all file buffers except currently open one and temporary buffers and stuff."
  (delq (current-buffer)
    (remove-if-not 'buffer-file-name (buffer-list))))
```

And the last function we need is this:

```lisp
(defun flycheck-all-file-buffers nil
    "Simply run flycheck on all file buffers."
    (interactive)
    (mapc 'flycheck-buffer* (other-file-buffer-list)))
```
Lastly, we need to add this function to `after-save-hook`. But I want to be a able to disable/enable this feature whenever I want. Because if you have a lot of buffers open, this feature may cause some laggyness on save events.

```lisp
(defun enable-flycheck-all-file-buffers-on-save nil
  (interactive)
  (add-hook 'after-save-hook 'flycheck-all-file-buffers))

(defun disable-flycheck-all-file-buffers-on-save nil
  (interactive)
  (remove-hook 'after-save-hook 'flycheck-all-file-buffers))
```

# The Result
Run `M-x` then call `enable-flycheck-all-file-buffers-on-save`. From now on, when you save a file, other files will be flychecked too. To disable it, call `disable-flycheck-all-file-buffers-on-save`.

```lisp
(defun flycheck-buffer* (buffer)
  "Runs flycheck on given BUFFER."
  (with-current-buffer buffer
    (flycheck-buffer)))

(defun other-file-buffer-list nil
  "Returns the list of all file buffers except currently open one and temporary buffers and stuff."
  (delq (current-buffer)
    (remove-if-not 'buffer-file-name (buffer-list))))

(defun flycheck-all-file-buffers nil
    "Simply run flycheck on all file buffers."
    (interactive)
    (mapc 'flycheck-buffer* (other-file-buffer-list)))

(defun enable-flycheck-all-file-buffers-on-save nil
  (interactive)
  (add-hook 'after-save-hook 'flycheck-all-file-buffers))

(defun disable-flycheck-all-file-buffers-on-save nil
  (interactive)
  (remove-hook 'after-save-hook 'flycheck-all-file-buffers))
```
