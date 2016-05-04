TAX=\
	citations.dmp \
	delnodes.dmp \
	division.dmp \
	gc.prt \
	gencode.dmp \
	merged.dmp \
	names.dmp \
	nodes.dmp \
	readme.txt

taxonomy.tab : names.dmp
	@echo "Extracting taxonomy..."
	@$(KTPATH)/scripts/extractTaxonomy.pl .

names.dmp : $(wildcard taxdump.tar taxdump.tar.gz)
	@tar -xmf $<

.PHONY clean :
clean :
	@rm -f taxdump.tar
	@rm -f taxdump.tar.gz
	@rm -f $(TAX)
