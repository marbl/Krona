release="KronaTools-$1"
mv KronaTools $release
tar -cf $release.tar \
	$release/scripts/ClassifyBLAST.pl \
	$release/scripts/extractTaxonomy.pl \
	$release/scripts/GetContigMagnitudes.pl \
	$release/scripts/ImportBLAST.pl \
	$release/scripts/ImportGalaxy.pl \
	$release/scripts/ImportMETAREP.pl \
	$release/scripts/ImportMGRAST.pl \
	$release/scripts/ImportPhymmBL.pl \
	$release/scripts/ImportRDP.pl \
	$release/scripts/ImportRDPComparison.pl \
	$release/scripts/ImportTaxonomy.pl \
	$release/scripts/ImportText.pl \
	$release/scripts/ImportXML.pl \
	$release/scripts/indexGIs.pl \
	$release/lib/Krona.pm \
	$release/src/krona-$2.js \
	$release/img/hidden.png \
	$release/install.pl \
	$release/updateTaxonomy.sh \
	$release/deployResources.sh \
	$release/README.txt \
	$release/LICENSE.txt
mv $release KronaTools
