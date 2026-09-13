#!/bin/sh
echo "$1" | doas tee /sys/devices/system/cpu/intel_pstate/no_turbo
