/****************************************************************************
 * Copyright 2010,2011 Benjamin Kellermann                                  *
 *                                                                          *
 * This file is part of dudle.                                              *
 *                                                                          *
 * Dudle is free software: you can redistribute it and/or modify it under   *
 * the terms of the GNU Affero General Public License as published by       *
 * the Free Software Foundation, either version 3 of the License, or        *
 * (at your option) any later version.                                      *
 *                                                                          *
 * Dudle is distributed in the hope that it will be useful, but WITHOUT ANY *
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or        *
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public     *
 * License for more details.                                                *
 *                                                                          *
 * You should have received a copy of the GNU Affero General Public License *
 * along with dudle.  If not, see <http://www.gnu.org/licenses/>.           *
 ***************************************************************************/

"use strict";

// Register Namespace
if (typeof(GPGAuth) === "undefined") {
	var GPGAuth = {};
} else {
	alert("Somebody captured the Namespace GPGAuth!!!");
}




var SignedMessage = function (sig) {
	// FIXME: parse sig
	this.keyid = "491a3d9c";
	this.message = "{}";
	this.fingerprint = "DEAD BEEF 0000 CAFE BABE  C00L D00D 0000 BAAD FEED";
};

SignedMessage.prototype.check = function (pubkey) {
	// FIXME: check signature
	this.correct = true; //Math.random() > 0.5;
	return this.correct;
};

var PublicKey = function (asciikey) {
	this.keyid = "491a3d9c";
	this.name = "fix me " + Math.round(Math.random()*100).toString();
	this.mail = "fix.me@example.org";
	this.fingerprint = "DEAD BEEF 0000 CAFE BABE  C00L D00D 0000 BAAD FEED";
};
