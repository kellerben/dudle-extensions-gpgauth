#!/usr/bin/env ruby
############################################################################
# Copyright 2011 Benjamin Kellermann                                       #
#                                                                          #
# This file is part of dudle.                                              #
#                                                                          #
# Dudle is free software: you can redistribute it and/or modify it under   #
# the terms of the GNU Affero General Public License as published by       #
# the Free Software Foundation, either version 3 of the License, or        #
# (at your option) any later version.                                      #
#                                                                          #
# Dudle is distributed in the hope that it will be useful, but WITHOUT ANY #
# WARRANTY; without even the implied warranty of MERCHANTABILITY or        #
# FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     #
# License for more details.                                                #
#                                                                          #
# You should have received a copy of the GNU Affero General Public License #
# along with dudle.  If not, see <http://www.gnu.org/licenses/>.           #
############################################################################

require "rubygems"
require "open-uri"
require "hpricot"
require "cgi"
require "json"
$c = CGI.new

$header = {"type" => "text/plain", "status" => "200 OK"}

$body = ""

case ($c["service"])
when "peopleSearch"
	# FIXME: delete expired keys (op=vindex)
	begin
		page = Hpricot(open("http://pgp.zdv.uni-mainz.de:11371/pks/lookup?op=index&search=#{CGI.escape($c["name"])}"))
		$body += page.search("//pre").collect{|a|
			a.search("/a").collect{|e| e.inner_html }.join(" ") unless a.inner_html =~ /REVOKED/
		}.compact.to_json
	rescue => e
		if e.message =~ /^500/
			$body = "No key with the name #{$c["name"]} found"
			$header["status"] = "404 NOT FOUND"
		else
			raise e
		end
	end
when "getPublicKey"
	begin
		page = Hpricot(open("http://pgp.zdv.uni-mainz.de:11371/pks/lookup?op=get&search=0x#{$c["keyid"]}"))
		$body = page.search("//pre").inner_html.chomp.reverse.chomp.chomp.reverse
	rescue => e
		if e.message =~ /^500/
			$body = "No key with keyid #{$c["keyid"]} found"
			$header["status"] = "404 NOT FOUND"
		else
			raise e
		end
	end
end

$c.out($header) {$body}
