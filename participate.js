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

GPGAuth.getPublicKey = function (keyID, successfunc, notfoundfunc) {
	var hkp = new openpgp.HKP('https://pgp.mit.edu');
	hkp.lookup({keyId: keyID}).then(function (pubKey) {
		if (pubKey) {
			successfunc(openpgp.key.readArmored(pubKey));
		} else {
			notfoundfunc();
		}
	});
};

GPGAuth.replaceName = function (userinput, img, title) {
	userinput.before_name = userinput.before_name || "";
	userinput.before_name += "<img";
	userinput.before_name += " style='float: left'";
	userinput.before_name += " class='GPGAuthSigned'";
	userinput.before_name += " title='" + title + "'";
	userinput.before_name += " src='" + GPGAuth.extDir + "/img/" + img + ".png'";
	userinput.before_name += "/>";
};
Poll.parseNaddHook(function (userinput, returnfunc) {
	var authimage, sig;
	if (userinput.GPGsig) {
		try {
			sig = openpgp.cleartext.readArmored(userinput.GPGsig);
			GPGAuth.getPublicKey(sig.getSigningKeyIds()[0].toHex(), function (pubkey) {
				var sigmsg;
				try {
					sigmsg = JSON.parse(sig.text);
					sigmsg.name = escapeHtml(sigmsg.name);
					$.each(sigmsg, function (col, val) {
						userinput[col] = val;
					});
					if (sig.verify(pubkey.keys)[0].valid) {
						GPGAuth.replaceName(userinput, "signed", printf(_("Signed Vote: %1, %2"), [pubkey.keys[0].users[0].userId.userid, pubkey.keys[0].primaryKey.fingerprint.toUpperCase().replace(/(....)/g,"$1 ").trim()]));
					} else {
						GPGAuth.replaceName(userinput, "signed_broken", _("The signature of the vote was not correct. The vote is possibly tampered!"));
					}
				} catch (err) {
					GPGAuth.replaceName(userinput, "signed_unknown", printf(_("Error while parsing the vote of %1: %2"), [escapeHtml(userinput.name), err]));
					//Poll.hint(sig.text);
				}
				returnfunc();
			}, function () { // public key not found
				GPGAuth.replaceName(userinput, "signed_unknown", printf(_("Unknown Signer (key not found: %1)"), [sig.getSigningKeyIds()[0].toHex().toUpperCase().replace(/(........)/g,"$1 ").trim()]));
				returnfunc();
			});
		} catch (err) {
			GPGAuth.replaceName(userinput, "signed_unknown", printf(_("Error while parsing the PGP signature of %1: %2"), [escapeHtml(userinput.name), err]));
			returnfunc();
			//Poll.hint(userinput.GPGsig);
		}
	} else {
		returnfunc();
	}
});

GPGAuth.enabled = (gfGetLocal("GPGAuth_enable") === "true");
GPGAuth.handleUserInput = function (participantInput, submitfunc) {
	if (GPGAuth.enabled) {
		GPGAuth.goahead = function () {
			if ($("#signText").val().match(/-----BEGIN PGP SIGNATURE-----/)) {
				participantInput.GPGsig = $("#signText").val();
			}
			Poll.exchangeAddParticipantRow();
			submitfunc(participantInput);
		};
		var innerTr, oldname;
		innerTr = [];
		innerTr.push($("<td />", {
			"colspan" : '2',
			"text" :_("Please sign the following code:")
		}));

		oldname = participantInput.oldname;
		delete participantInput.oldname;
		innerTr.push($("<td />",{
			"colspan" : Poll.columns.length
			})
			.append($("<textarea />",{
				"rows" : 5,
				"cols" : 40,
				"id" : 'signText',
				"text" : JSON.stringify(participantInput)
			}))
		);
		participantInput.oldname = oldname;

		innerTr.push($("<td />")
				.append($("<input />", {
					"type" : 'button',
					"onClick" : 'GPGAuth.goahead()',
					"value" :_("Save")
				}))
		);
		Poll.exchangeAddParticipantRow(innerTr);
	} else {
		submitfunc(participantInput);
	}
};

if (GPGAuth.enabled) {
	Poll.prepareParticipantInput(GPGAuth.handleUserInput, {
		before: function () {
			var label = {};
			label[GPGAuth.enabled] = _("Next");
			label[!GPGAuth.enabled] = $("#savebutton").val();
			$("#savebutton").val(label[GPGAuth.enabled]);
			$("#savebutton").after("<br /><input type='checkbox' id='useGPG' /><label for='useGPG'> " + _("Sign Vote") + "</label>");
			$("#useGPG").on("click", function () {
				GPGAuth.enabled = !GPGAuth.enabled;
				$("#savebutton").val(label[GPGAuth.enabled]);
				// use replaceWith instead of val() to make it resistant to form.reset
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			});
			$("#polltable form").on("reset", function(){
				$("#useGPG").replaceWith("<input type='checkbox' " + (GPGAuth.enabled ? "checked='checked' " : "") + "id='useGPG' />");
			})
			$("#useGPG").attr("checked", GPGAuth.enabled);
		}
	});
}

