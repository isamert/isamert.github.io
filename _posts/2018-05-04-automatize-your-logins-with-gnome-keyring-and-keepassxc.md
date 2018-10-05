---
layout: post
title:  "Automatize your logins with gnome-keyring (and optionally with KeePassXC)"
date:   2018-10-05 23:49:47 +0300
categories: jekyll update
---

Storing passwords in plain-text is not an encouraged act but typing your password every time you start an application is also cumbersome. To solve this dilemma, the easiest solution I came up with is using `gnome-keyring` to store my passwords. I’m not using gnome either but `gnome-keyring` does not have much dependencies and a lot of applications already requires it. So I believe `gnome-keyring` is a good choice. The thing I want to achieve is something like this:
– Store my passwords in `gnome-keyring` so that they are encrypted.
– When I login to my computer, `gnome-keyring` automatically gets unlocked so that programs can get required passwords without hassling with me.

But there is a problem in this particular solution, at least for me. I’m using *KeePassXC* to manage my passwords, so copying all those passwords-or just the required ones, still a lot- to `gnome-keyring` is not feasible. So I need to do something about that too.
Installing/configuring `gnome-keyring`

Skip this step if you already have a running `gnome-keyring`.

-   Just install these packages: `gnome-keyring`, `libsecret` and `seahorse`.
-   You need to create a keyring named login so that when you login, that particular keyring gets unlocked. To create that, open `seahorse` and follow *File -> New -> Password Keyring*. Name it as *login* and as password enter your login password. This method works with login managers generally, if you are not using one, you need to figure it out. But getting `gnome-keyring` unlocked at login is not a big deal, if its locked, the first time a program requests for a password, `gnome-keyring` will show a prompt and ask for your password to unlock that keyring. Subsequent password requests will go silently because you have unlocked that keyring.

# Adding passwords to `gnome-keyring`
We need to create a *Stored Password* in *login* keyring that we’ve just created. But the problem is it is not possible to create *Stored Passwords* with attributes in `seahorse`, we need to attach attributes to passwords because the command-line tool `secret-tool` requires them while querying for a password. So what you need to do is, simply create your *Stored Password* using `secret-tool`:

```sh
secret-tool store --label=Mail name mail_password
```

Then it will ask for the password. *name* and *mail<sub>password</sub>* are key-value pairs. You can add more attributes like them or change them as you wish. Now you can see the added password in `seahorse`. (You may wonder why we did not specify keyring name while adding password. Because this command adds your password to your default keyring, which is the *login* keyring. If it’s not the default one, right-click on it in `seahorse` and set as default.)

If you are using KeePassXC like me, my advise would be instead of duplicating your passwords in `gnome-keyring`, only add your keepass password in `gnome-keyring`: `secret-tool store --label=KeePass name keepass_password` I’ll get to the usage later.

# Querying for a password
So you have your passwords in `gnome-keyring` and you want to supply that passwords to some program. Of course every program has different method for storing/getting your password. I’m going to use `mutt` as an example (it’s a command-line mail client). But first, lets see how do we get our password:

```sh
secret-tool lookup name mail_password
```

This command will print your password. To configure mutt to use `gnome-keyring`, simply add this line to your muttrc:

```sh
set imap_pass=`secret-tool lookup name mail_password`
```

# KeePassXC
To get a password from KeePassXC, use this command:

```sh
secret-tool lookup name keepass | keepassxc-cli show /path/to/keepass/db/file "/path/to/password/entry"
```

But this prints a lot of information. To just get the value of *Password* entry, use something like this:

```sh
secret-tool lookup name keepass | keepassxc-cli show /path/to/keepass/db/file "/path/to/password/entry" | grep "Password: " | head -n 1 | cut -c 11-
```

To see your database structure, use this command:

```sh
secret-tool lookup name keepass | keepassxc-cli ls /path/to/keepass/db/file
```

This will only list top level entries and directories, you can add, for example, “/email” to this command and it will print out entries under */email* folder.

For your muttrc, you need to add this:

```sh
set imap_pass=`secret-tool lookup name keepass | keepassxc-cli show /path/to/keepass/db/file "/path/to/password/entry" | grep "Password: " | head -n 1 | cut -c 11-`
```




# Security concerns

You may say that this kind of approach exposes all of our passwords to all user-level programs. Actually this is kind of behavior I’m trying to achieve here, so that I don’t need to type my passwords for each program. If you have a malicious program in your system, it will eventually get your passwords anyway. But `gnome-keyring` gives you a lot of flexibility. You can lock your keyring after your programs logged in or you can keep your keyring locked all the time(in that case, every time a program tries to use your password, `gnome-keyring` will ask for your user password. So you will just use one password for your every login which is also better than typing different passwords to different programs every time) etc. This is a much better solution than keeping your passwords as plain-text in your configuration files or typing them manually every time.

Also you can probably do the same things with kwallet if you are using KDE. Just search for equivalent commands for kwallet.

