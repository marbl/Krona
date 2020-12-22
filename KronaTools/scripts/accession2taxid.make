ACC2TAXID=\
	dead_nucl.accession2taxid \
	dead_prot.accession2taxid \
	dead_wgs.accession2taxid \
	nucl_gb.accession2taxid \
	nucl_wgs.accession2taxid \
	prot.accession2taxid

ACC2TAXID_FMT=$(ACC2TAXID:.accession2taxid=.accession2taxid.fmt)

../all.accession2taxid.sorted : $(ACC2TAXID_FMT)
	@echo "Merging..."
	@LC_ALL=C TMPDIR=. sort -m $(ACC2TAXID_FMT) > $@
	@rm $(ACC2TAXID_FMT)

FORMAT4 := grep -v accession | cut -f 1,3
FORMAT2 := grep -v accession | sed 's/\.[[:digit:]]*//;s/ /	/'

%.accession2taxid.fmt : %.accession2taxid
	@echo "Formatting $<..."
	@if [ `awk '{print NF; exit}' $<` = "2" ]; then \
		cat $< | ${FORMAT2} > $@; \
	else \
		cat $< | ${FORMAT4} > $@; \
	fi
ifneq ("${PRESERVE}", "1")
	@rm $<
endif

%.accession2taxid.fmt : %.accession2taxid.gz
	@echo "Formatting $<..."
	@if [ `gunzip -c $< | awk '{print NF; exit}'` = "2" ]; then \
		gunzip -c $< | ${FORMAT2} > $@; \
	else \
		gunzip -c $< | ${FORMAT4} > $@; \
	fi
ifneq ("${PRESERVE}", "1")
	@rm $<
endif
