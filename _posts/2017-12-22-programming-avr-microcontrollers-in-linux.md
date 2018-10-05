---
layout: post
title:  "Programming AVR microcontrollers in Linux"
---

The *Windows way* of doing that is just using *ATMEL Studio* but we don’t have it in Linux. As a customization freak, I’ll just write the steps of how to compile and flash your program to an AVR microcontroller and leave the rest for you. So integrating this steps into your favorite *IDE*, if you are using one, is your job.

# Tools
These are the tools that we need to install, just pull them from your package manager (These package names exists in Arch Linux repos, they might differ in other distros repositories):
-   **avr-gcc** GNU C compiler for AVR architecture
-   **avr-libc** AVR libraries
-   **avr-binutils** Some AVR tools, we need it to create hex files from compiled programs, because avrdude needs a hex file instead of a binary to flash.
-   **avrdude** A *dude* that is required to perform flashing

# Steps
1.  Write your program. Let’s say you named it main.c.
2.  Compile it.
    ```sh
    avr-gcc main.c -Os -Wall -mmcu=atmega32 -o main_bin
    ```
    - Change **-mmcu** from *atmega32* to your devices name. You can find your devices MCU from [here](http://www.nongnu.org:80/avrdude/user-manual/avrdude_4.html).
3.  Convert your program to hex from binary.
    ```sh
    avr-objcopy -j .text -j .data -O ihex main_bin "main.hex"
    ```
4.  Flash it.
    ```sh
    avrdude -c usbasp -p m32 -U flash:w:"main.hex"
    ```
    -   Here you can see **-p** option. You need to specify it according to your device. The list is [here](http://www.nongnu.org:80/avrdude/user-manual/avrdude_4.html).
    -   Also here you can see **-c** option. It specifies programmer type. In my case it’s *usbasp*. So you should change it to whatever you are using. [Here](http://www.nongnu.org:80/avrdude/user-manual/avrdude_12.html) is the list of programmer that avrdude accepts. (If your programmer isn’t in the list, which is probably not the case, you can specify your programmer as shown in the same page and save it to a ini file. Then add -C option that points the ini file you just write.)

# The correct way of using avrdude
When you do the last step, you will get an error that says you don’t have permissions. You can just run avrdude with sudo and it will work this time. But of course this is not the preferred way to do it. What you need to do is write an udev rule so we can access programmer without root privileges.

1.  Create this file: `/etc/udev/rules.d/55-avr-programmer.rules`
2.  Write this into file:
    ```
    # USB-ASPcable
    ATTR{idVendor}=="16c0", ATTR{idProduct}=="05dc", GROUP="plugdev", MODE="0666"
    ```
    - Again, as you can see this configuration is for my programmer, usbasp. You need to change idVendor and idProduct according to your device. To find these values, just run lsusb(If you are using usb extender cord or something like that, it is possible that lsusb might not display your device. Just connect your programmer directly to your PC if that is the case):
        ```
        > lsusb
        ...
        Bus 003 Device 010: ID 16c0:05dc Van Ooijen Technische Informatica shared ID for use with libu
        ...
        ```
    -   In sixth column, you can see your devices vendor id and product id in this format `VENDOR_ID:PRODUCT_ID`. So edit your file according to this information.
3.  You may restart your computer or just use these commands to reload udev rules:
    ```sh
    $ sudo udevadm control --reload-rules
    $ sudo udevadm trigger
    ```
    - You may need to unplug your programmer and plug it back. From now on you can use *avrdude* without needing root privileges.

