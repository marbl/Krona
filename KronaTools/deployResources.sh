#! /bin/bash

if [ $# -lt 1 ]
then
	echo ""
	echo "deployResources.sh <target>"
	echo ""
	echo "Links Krona web resources to <target> (i.e. a folder within /var/www) to create"
	echo "a local server. Krona charts can then be made to point to these resources when"
	echo "they are created (see -u). This is useful for deployment on isolated intranets."
	echo ""
	
	exit
fi

target=$1

if [ ! -e $target ]
then
	echo "$target does not exist...attempting to create..."
	mkdir $target
	
	if [ $? != "0" ]
	then
		echo "ERROR: could not create $target."
		exit
	fi
fi

if [ ! -e $target/src ]
then
	mkdir $target/src
fi

if [ ! -e $target/img ]
then
	mkdir $target/img
fi

cp $PWD/src/krona-*.js $target/src
cp $PWD/img/hidden.png $PWD/img/favicon.ico $PWD/img/loading.gif $PWD/img/logo-med.png $target/img

echo "Finished."
