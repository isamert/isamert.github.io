---
layout: post
title:  "Nice little curl commands"
---

Here are some curl friendly web services that you can use in your terminal:

# Weather
-   `curl wttr.in` Displays a nice weather report.
    -   You can also specify city-code like this: `wttr.in/city_name`
    -   If the output is too long for your terminal, just use it with less: `curl wttr.in | less -R`

# IP
-   `curl https://api.ipify.org` Simply shows your public ip.
-   `curl ipinfo.io` Prints a formatted JSON that contains information about your ip.

# File/URL
-   `curl -F'file=@yourfile.png' https://0x0.st` Uploads specified file to 0x0.st and returns the url.
-   `curl -F'shorten=http://example.com/some/long/url' https://0x0.st` Shortens the given URL.
    -   Just visit [0x0.st](https://0x0.st) for more information.
-   `curl --upload-file ./hello.txt https://transfer.sh/hello.txt` Uploads specified file to transfer.sh and returns the url.
    -   This service is more sophisticated, you can set some constraints to your files and stuff. Visit [transfer.sh](https://transfer.sh) for more examples with curl.

# Cheat sheets
-   `curl http://cheat.sh/tar` Shows a simple cheatsheet for specified command (in this case `tar`)
-   `curl https://raw.githubusercontent.com/tldr-pages/tldr/master/pages/common/tar.md` Same thing with above but this uses [tldr](https://github.com/tldr-pages/tldr). But there are some problems:
    -   raw.githubusercontent.com/tldr-pages/tldr/master/pages/ **common** / **tar** .md
    The first bold part may be one of these: `common`, `linux`. The second bold part is the command itself. If the command is linux-spesific, its under the `linux` folder obviously and most of the other things goes to `common`. You can create a small script that takes `command` as input and checks the folders one by one and returns if it finds an existing page. *This is left as an exercise for the reader.* (or you may just simply install a client, visit [tldr](https://github.com/tldr-pages/tldr)).

# Translate
This is not really curl friendly but it works.

```sh
curl -s -A "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0" "https://translate.google.com/m?sl=FROM&tl=TO&ie=UTF-8" --data-urlencode "q=WORD_OR_SENTENCE" | grep -Po '<div dir="ltr" class="t0">\K[^<]*'
```

-   Change `FROM` to source language code, for example `en` for English.
-   Change `TO` to destination language code, for example `tr` for Turkish.
-   Change `WORD_OR_SENTENCE` to anything you want. You can use spaces.
-   Wrap this to a bash script and enjoy easy translations.

This example demonstrates how you can get the relevant information from an ordinary website. Always use the mobile versions if available because it is easier to parse them.

# Cryptocurrency rates
-   `curl rate.sx` Shows the cryptocurrency rates.
    -   Run `curl rate.sx/:help` for more information about usage.

# ASCII QR Codes
-   `curl qrenco.de/STRING` Turns given string/url into an ASCII art QR code.

# WebDAV
If you are using a *service* that supports WebDAV, you can use these simple curl commands to download/upload files to your service. You can also do more sophisticated things with curl but if you need more than just downloading/uploading files then it's better to use a client dedicated for that service.

-   Downloading:
    -   `curl -u LOGIN:PASSWORD  https://WEBSITE.com/DAV_PATH/REMOTE_FILE --output FILE`
    -   Downloads the `server_dav://REMOTE_FILE` to `FILE`
-   Uploading:
    -   `curl -u LOGIN:PASSWORD -T FILE https://WEBSITE.com/DAV_PATH/REMOTE_FILE`
    -   Uploads FILE to `server_dav://REMOTE_FILE`

It's better not to write your password while using these commands. If you remove the password part it will just simply show you a password prompt when you execute these commands which better than exposing your password to bash history.

# Convert Documents
I'll just leave a link here: [docverter.com](https://docverter.com/). You can convert nearly any format to any other one using this service. It has a nice and clear API. The website provides curl command examples.

