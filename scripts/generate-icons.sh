#!/bin/bash

icon=$1
windows_file=$icon

while getopts 'w:' flag; do
	case "${flag}" in
		w) windows_file="${OPTARG}" ;;
	esac
done

function generate_icns() {
	mkdir icon.iconset

	sips -z 16  16  $icon -o icon.iconset/icon_16x16.png
	sips -z 32  32  $icon -o icon.iconset/icon_16x16@2x.png
	sips -z 32  32  $icon -o icon.iconset/icon_32x32.png
	sips -z 64  64  $icon -o icon.iconset/icon_32x32@2x.png
	sips -z 128 128 $icon -o icon.iconset/icon_128x128.png
	sips -z 256 256 $icon -o icon.iconset/icon_128x128@2x.png
	sips -z 256 256 $icon -o icon.iconset/icon_256x256.png
	sips -z 512 512 $icon -o icon.iconset/icon_256x256@2x.png
	sips -z 512 512 $icon -o icon.iconset/icon_512x512.png

	cp $icon icon.iconset/icon_512x512@2x.png

	iconutil -c icns icon.iconset
	mv icon.icns ./src-tauri/icons/icon.icns

	rm -R icon.iconset
}

function generate_ico() {
	magick $windows_file -define icon:auto-resize=32,16,24,48,64,128,256 -compress zip ./src-tauri/icons/icon.ico
}

function generate_pngs() {
	magick $icon -resize 32x32   ./src-tauri/icons/32x32.png
	magick $icon -resize 64x64   ./src-tauri/icons/64x64.png
	magick $icon -resize 128x128 ./src-tauri/icons/128x128.png
	magick $icon -resize 256x256 ./src-tauri/icons/128x128@2x.png
}

generate_icns
generate_ico
generate_pngs
