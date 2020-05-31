---
layout: post
title:  "Better Keyboard Experience in Linux"
---

In this post, I'll try to describe a more healthy and productive way of using keyboard in GNU/Linux, particularly under X.org. My main goal is not to impose a certain way of using keyboard but to introduce some concepts and some very useful tools that you can build your workflow upon.

# The case against the mouse

_(This part is mostly just me rambling, feel free to skip it)_

First of all, I'm a big believer of a keyboard-oriented workflow, Sometimes it costs more time to use the keyboard but it helps me to stay sane. Mouse generally requires a certain level of consciousness, like you need to aim for stuff, try to be precise while selecting something, etc. The content you are dealing with the mouse is not static, so you need to do some calculation every time to get the desired action with the mouse. But with the keyboard, you can just mindlessly press your 4-key shortcut and get a magic happening. After a certain point, even your most complex shortcuts become a reflexive response.

There are use cases for mouse too, of course! Mindlessly scrolling down a website is always better done with a mouse on your lap. Some jobs may be better suited for a drag-drop focused workflow and I get them. What I try to minimize is that when you are doing a keyboard-focused work and you need mouse time to time. That is just a distraction and a cause of wrist pain. Other than that, trying to eliminate mouse is pointless.

# Modifying the keymap

To get the most out of your keyboard, we need to create a specialized keymap for ourselves. For doing that I'll be using `xmodmap`. `xmodmap` is a simple utility tool for modifying your keymaps. The configuration is generally done through `~/.Xmodmap` file.

## Selecting the proper base keymap

I simply recommend using `us(intl)` keymap as our base keymap. Because this keymap enables us to use `AltGr` key which will become super beneficial later in this post. To set your keymap to `us(intl)`, do this:

```sh
localectl set-x11-keymap 'us(intl)'
```

You need to restart your X session to get it working or you can simply do this:

```sh
setxkbmap 'us(intl)'
```

## Fixing some problems with the `us(intl)`

While it enables `AltGr` key, it also turns backtick and apostrope keys into modifier keys that creates accented versions of pressed key. I do not want this behavior, to get the normal behavior add these into your `~/.Xmodemap`.

```
keysym dead_grave = grave asciitilde
keysym dead_acute = apostrophe quotedbl
```

## Empowering the `[`, `]` keys

When you press `Shift + [` you get `{`. As a natural extension to that, I bind `AltGr+[` to `(`. This is simply easier than doing `Shift+9`, considering parentheses used frequently while coding, this change is a nice touch. Put these into your `~/.Xmodmap`:

```
!! AltGr+[ → (, AltGr+] → )
keysym bracketleft = bracketleft braceleft bracketleft braceleft parenleft
keysym bracketright = bracketright braceright bracketright braceright parenright
```

## More UTF-8 chars

Most of the modern programming languages supports using UTF-8 glyphs. For example you can use `→` instead of `->` or `≥` instead of `>=`. They are more expressive, better-looking and feels right. Also while preparing a document or while having a causal conversation, it's just nicer to utilize these characters. Here is the related part of mine `~/.Xmodmap`:

```
!! Quick access for some unicode chars
!! altgr + b → λ  | altgr + a → →
!! altgr + n → ¬  | altgr + d → ⇒
!! altgr + , → ≤  | altgr + . → ≥
!! altgr + = → ≠  | altgr + shift + = → ≔
!! altgr + / → ÷  | altgr + ; → ∷
!! altgr + 8 → ×  | altgr + t -> ✓
!! altgr + x → ❌ | altgr + f → ∀

keysym b = b B b B U03BB
keysym a = a A a A U2192
keysym x = x X x X U274C
keysym f = f F f F U2200
keysym n = n N n N U00AC
keysym d = d D d D U21D2
keysym t = t T t T U2713
keysym 8 = 8 asterisk 8 asterisk multiply
keysym comma = comma less comma less U2264
keysym period = period greater period greater U2265
keysym equal = equal plus equal plus U2260 U2254
keysym question = slash question slash question division
keysym semicolon = semicolon colon semicolon colon U2237
```

## A new modifier key, Hyper

`CapsLock`, at least for me, one of the most useless key on the keyboard. Actually it's kinda more useful, when you compare it with the `RightCtrl`, at least you can press it. But the functionality is not really required, do you really find yourself typing in all caps for long periods of time? Even if so, you can simply write them all in lowercase and convert them to upper case with the help of your favorite text editor. What I like to do is, remap the `CapsLock` key to a new modifier key, namely `Hyper`, which enables you to create new shortcuts. You can think `Hyper` like the `Control` key but no program uses it and you are free to map anything you want to. Here is the relevant `~/.Xmodmap` configuration:

```
!! Unmap capslock
clear Lock
keycode 66 = Hyper_L
!! Leave mod4 as windows key _only_
remove mod4 = Hyper_L
!! Set mod3 to capslock
add mod3 = Hyper_L
```

Now we will be able to create shortcuts using this `Hyper` key. I'll come to this later in this post.

Another thing is that some people like to do is that using `CapsLock` as `ESC` and I'm also into that, but I don't want to sacrifice my `Hyper` key too. For this there is a solution, which involves using another simple tool where you use `CapsLock` key as the `Hyper` key when combined with the other keys but when it's pressed alone it acts as the `ESC` key. I'll come to this later in this post too.

## `RightCtrl`?

I don't know if anybody uses this key unironically but the only use case I found for it was using it as the `ESC` key. On my older keyboard I was able to press `RightCtrl` with my palm and as the `ESC` key it served me quite well. But it's harder to press `RightCtrl` with my palm on my new keyboard so I just do not use it anymore. I'm simply using the `CapsLock` as the `ESC` as I described above. But here is the configuration for using `RightCtrl` as the `ESC` if you want to give it a shot:

```sh
keycode 105 = Escape
```

## Global directional keys

I do not like to leave the home row of my keyboard, it's just hard to reach for the arrow keys for example. Also when you get used to `h,j,k,l` keys in vim for directional movement, you just want them everywhere. So I simply remapped `AltGr + {h,j,k,l}` to `{Left, Down, Up, Right}` keys respectively. When you press `AltGr + j` it acts like `Down` key, anywhere in your system. You do not need configuration per program, you just need to have this in your `~/.Xmodmap`:

```
keysym h = h H h H Left Home
keysym j = j J j J Down Prior
keysym k = k K k K Up Next
keysym l = l L l L Right End
```

This configuration also binds `AltGr + Shift + {h,j,k,l}` to `Home, Prior, Next, End` keys. I have a little issue with this combination though, when you do a `AltGr + Shift + h` it gets registered as `Shift + Home`. This makes some programs select the text till the beginning of the line from where your cursor is, but for some programs it does not do that. The programs I use mostly behave in way that I want.

Side note for Emacs users: I generally do not use these bindings in Emacs to make a movement but sometimes I do use them and Emacs does a selection when I press them. You can disable shift selection to get the desired result:

```elisp
(setq shift-select-mode nil)
```

## More with `AltGr`

As you may have inferred, to create a combination involving `AltGr` you need to change fifth field of the `keysym` assignment.

```
!! AltGr + j → Down
!! I'm not quite sure what the second j J part does but I accepted that as it is
keysym j = j J j J Down
```

You can use `AltGr` to create accented characters, this might be a nice alternative for constantly switching between your native keyboard layout and `us(intl)`. If you find any other use cases for this key, let me know! The nice part of utilizing this key is that, like the `Alt` key, you use your thumb for pressing it and your thumb is the most powerful finger on your hand. So it makes sense to embrace keys like `Alt`, `AltGr`.

# Shortcuts, key-bindings

There are tons of programs that can handle this but my personal favorite is `sxhkd`. It's DE/WM agnostic, the configuration is pretty simple and intuitive. It also supports key chording, which is just fantastic.

I use my `super` (windows) key for the WM related shortcuts; like `super + {h,j,k,l}` for switching the focused window, `super + {comma, period}` for focusing next/prev monitor, `super + w` for closing the current window etc. Observe the following configuration to get a taste of `sxhkd`:

```
# Focus the next/previous desktop
super + {n,p}
    bspc desktop --focus {next,prev}.local

# audio/mic toggle
XF86Audio{_,Mic}Mute
    amixer set {Master,Capture} toggle
```

I use `hyper` key to manage all the programs I have, or to run stuff. `hyper + p` does a play/pause, `hyper + c` opens a calendar in a popup-like window, `hyper + t` opens a popup for translation etc. These things take a lot of keys, but I also want some shortcuts for opening programs. I can always do `hyper + a` and search for the specific program that I want to open by typing it's name but that's time consuming. A simple binding would be better but we already exhausted all the keys on the keyboard. This is where chord chains comes right in:

```
# Run stuff
hyper + r; {f, e, r, t, v, k, q}
    {firefox, emacsclient -c, jaro ~, lxtask, vivaldi-stable, keepassxc, qbittorrent}
```

When I do `hyper + r` followed by `f`, Firefox opens. Simple as that. This gives you whole new set of bindings. Multiple keys are also supported, for example, I have this in my configuration:

```
hyper + r; p; {s, p, w}
    sxiv {~/Pictures/screenshots/, ~/Pictures/phone/Camera/, ~/Pictures/wallpapers/}
```

Automating stuff through shortcuts is nice, especially if the program offers a nice set of command-line options. Sometimes programs does not offer a command-line interface but they offer a DBUS API that you can utilize, it's nice to keep this in mind while creating your bindings.

# Various tools/configurations

## `hyper` as `ESC`

As I mentioned above, I use `hyper` as a modifier key when used in combination with some other key. But when I press it by itself, it acts as `ESC` key. This is achieved through using a simple program called `xcape`. I start `xcape` with the arguments below and it gives me this functionality:

```sh
xcape -e 'Hyper_L=Escape'
```

The purpose of `xcape` is to make a modifier key to be used as another key when it is pressed and released on its own. So in this case, we simply say to `xcape` that make `hyper` act as `ESC` when it's pressed and released by its own. The thing is that, you may experience a slight delay, because `ESC` is registered right after you release your `hyper` key.

You can also use `shift` or `ctrl` (or any modifier) keys as `ESC` or any other key when they pressed and released on their own.

## `xev`

`xev` is a small utility program that may help you during the configuration phase. It simply shows X events, you can press keys or key combinations to get their key codes, key symbols etc.

# Things to consider

I try to create one-key bindings whenever I can. While this is not really possible on system level, it's quite possible in programs like Vim or Emacs. If I'm going to create a new binding that requires at least two keys (one being modifier key), I try to use `alt` key as the modifier first. I only use `ctrl` if I absolutely need to do that. Thumbs are very strong while pinkies get stressed pretty easily. One can argue based on this assumption that assigning `CapsLock` as `ESC` might be bad for my left pinky. I think this is a non issue because real stress happens when doing a key combination, simply hitting a key with my pinky does not generate much stress.

# Conclusion

I am always looking for ways to enhance my keyboard usage. I'm not a very-fast typist, at my best I can write ~70 WPM with high concentration (and for a short period of time). But the things I explained above are not for typing fast, they are for using your computer easier. Especially for programming. If you have more keyboard related tricks or better use cases for the programs I mentioned above, please share them with me!
