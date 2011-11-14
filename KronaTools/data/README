ec.tsv
======

This file is a list of short names of all Enzyme Commission categories.  It was
generated from data downloaded from the Integrated Microbial Genomes Human
Microbiome Project.  To recreate this file:

- Download the tab-delimited list of EC names:
  - Navigate to:
    http://www.hmpdacc-resources.org/cgi-bin/imgm_hmp/main.cgi?section=FindFunctions&page=enzymeList
  - Choose "Select All"
  - Choose "Export"

- Run:
  <KronaTools>/scripts/formatEC.pl <download_file> > <output>

The formatEC.pl script converts the format so it is easier to parse and removes
redundant descriptions from group names. For example:

  EC:1.-	Oxidoreductases.
  EC:1.1.-	Oxidoreductases. Acting on the CH-OH group of donors.

...becomes:

  1	Oxidoreductases
  1.1	Acting on the CH-OH group of donors
