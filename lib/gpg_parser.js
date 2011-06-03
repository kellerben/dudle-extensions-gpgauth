var SignedMessage = function (sig) {
	this.gp = new GPGPackageParser(sig);
	this.keyid = this.gp.get_signature_values().signature.issuer;
	this.message = this.gp.get_signature_values().signature.signature_content;
};

SignedMessage.prototype.check = function (pubkey) {
	if(this.gp.signature.signature_algo == "dsa") {
		this.correct = this.check_dsa(pubkey);
	} else {
		if(this.gp.signature.signature_algo == "rsa") {
			this.correct = this.check_rsa(pubkey);
		} else {
//      console.log("no suitable authentication method provided");
			this.correct = false;
		}
	}
	// FIXME: check signature
	this.correct = true;
	return this.correct;
};

var PublicKey = function (asciikey) {
	this.gp = new GPGPackageParser(asciikey);
	this.name_mail = this.gp.find_id_packet().id;
	this.name = this.name_mail.replace(/ <.*>/,"");
	this.mail = this.name_mail.replace(/.*<(.*)>/,"$1");
	// FIXME: parse id and fingerprint
	this.fingerprint = "DEAD BEEF 0000 CAFE BABE  C00L D00D 0000 BAAD FEED";
	this.ascii = asciikey;
};

SignedMessage.prototype.check_rsa = function(publickey) {

//     console.log("rsa started");

    publickey.get_keys();
    this.gp.get_keys();

		if (this.gp.get_signature_hash()) {
			var signature_hash = this.get_signature_hash.toUpperCase();
		} else {
			return false;
		}
    var signature_hash_decrypted = this.gp.signature.signature[0];

    //console.log("signature hash decrypted (hex): ");
    //console.log(bigInt2str(signature_hash_decrypted, 16));

    var key = publickey.keymaterial.rsa;
    var n = key[0];
    var e = key[1];
    var erg = powMod(signature_hash_decrypted, e, n);
    erg = bigInt2str(erg, 16);
    if(erg.slice(erg.length - signature_hash.length) == signature_hash)
	return true
    else 
	return false;  
}

SignedMessage.prototype.check_dsa = function(publickey) {

//  console.log("dsa started..");

//  console.log(this);
//  console.log(publickey);
	
	publickey.get_keys();
	this.gp.get_keys();

	if (this.gp.get_signature_hash()) {
		var signature_hash = this.get_signature_hash.toUpperCase();
	} else {
		return false;
	}
	
	var p = publickey.keymaterial[0].dsa[0];
	var q = publickey.keymaterial[0].dsa[1];
	var g = publickey.keymaterial[0].dsa[2];
	var y = publickey.keymaterial[0].dsa[3];

	var r = this.gp.signature.signature[0];
	var s = this.gp.signature.signature[1];	

	if(!negative(r) && !isZero(r) && greater(q,r) && !negative(s) && !isZero(s) && greater(q,s)) {

		var w = inverseMod(s,q);
		var u1 = multMod(signature_hash, w, q);
		var u2 = multMod(r, w, q);

		var v = multMod(powMod(g, u1, p), powMod(y, u2, p) , p);
		v = mod(v,q);
		
		v = bigInt2str(v, 16);
		r = bigInt2str(r, 16);
		return (v.slice(v.length - r.length) == r)

	}
	else {
		return false;
	}
}


/*******************************************/
GPGPackageParser = function(packet){
    var retval;
    if(typeof(packet) == 'string') {
	this.clearpacket = packet;
	if(packet.indexOf('-----BEGIN PGP SIGNED MESSAGE-----') >= 0){
	    this._parse_clearsigned(packet);
	} else return this._init(packet);
    }
    else return this._init_preparsed(packet);
}

GPGPackageParser.prototype = {
    log: function() {  
//    function(schtr) {
//	console.log("GPGParser-> " + schtr);
	return this;
    },
		reduce: function() {
			var fn = arguments[0];
			var start_value_p = arguments.length > 2;
			var start;
			var map;
			if(start_value_p) {
					map = arguments[2];
					start = arguments[1];
			}
			else {
					start = arguments[1][0];
					map = arguments[1].slice(1);
			}
			var i = 0;
			for(i in map){
		start = fn(start, map[i]);
			}
			return start;
		},
		find_id_packet: function() {
				var laufen = true, pubkey = this;
				while(laufen && pubkey) {
			if(pubkey.id) laufen = false;
			else pubkey = pubkey.get_next_packet();
				}
				return pubkey;
		},
    _parse_clearsigned: function(packet){
	var pgp_marker = {
	    begin: '-----BEGIN PGP SIGNED MESSAGE-----',
	    begin_sig: '-----BEGIN PGP SIGNATURE-----',
	    end: '-----END PGP SIGNATURE-----',
	    index:function(name){
		return packet.indexOf(pgp_marker[name]);
	    }
	};
	var cut_a_line = function(schtr){
	    var idx = schtr.indexOf("\n");
	    return schtr.slice(idx + 1);
	};
	var cut_a_line_rev = function(schtr){
	    var idx = schtr.lastIndexOf("\n");
	    return schtr.slice(0,idx);
	};
	var content = packet.slice(pgp_marker.index("begin") + pgp_marker.begin.length + 1, pgp_marker.index("begin_sig") - 1);
	var start_content = content.indexOf("{");
	var end_content = content.lastIndexOf("}");
	var start_hash = content.indexOf("SHA1");
	if(content.slice(start_hash, start_hash + 4) == "SHA1") this.hash_method = "SHA1";
	content = content.slice(start_content, end_content + 1).replace(/\n/gi, String.fromCharCode(13,10));//slice(start_content, end_content + 1);
	this.signature = {signature_content: content};
	this.log("content of clearsigned packet: " + content);
	packet = packet.slice(pgp_marker.index("begin_sig") + pgp_marker.begin_sig.length + 1, pgp_marker.index("end"));
	
	packet = cut_a_line_rev(cut_a_line_rev(cut_a_line(cut_a_line(packet))));
	//TODO!!!
	this.log("signature part of clearsigned packet: " + packet);
	this.log("base 64 encoded data as ba" + this.string2byteArray(packet));//JSON.stringify(packet));
	var decoded = base64.decode(packet.replace(/\n/ig, ""));//.join("")); ///TODO
	this.log("from base64 decoding: " + decoded);
	if(decoded) {
	    this._init_preparsed(decoded);
	} else return null;
    },
    _parse_header: function(offset){
	this.log("Wenn das Paket im alten Format ist 2, sonst 3: " + ((this.packet[offset] & 0xc0) >> 6));
	if(((this.packet[offset] & 0xc0) >> 6) != 2) return null;
 	retval = {};
	retval.packet_tag = ((this.packet[offset] & 0x3c) / 4); 
	var length_type = this.packet[offset] & 0x03;
	this.log("parse_header, laengen-typ: " + length_type);
	if(length_type < 2) retval.body_offset = length_type + 2 + offset;
	if(length_type == 2) retval.body_offset = 5 + offset;
	if(length_type == 3) retval.body_offset = 1 + offset;
	var new_length = 0;
	for(i = offset + 1; i < retval.body_offset; i++){//(i = retval.body_offset + 1; i > offset; i--){
	    new_length = (new_length << 8) | this.packet[i];
	}
	retval.length = new_length;
	retval._next_packet_offset = retval.body_offset + retval.length;
	return retval;
    },
    _parse_pubkey_header: function(offset){
	this.log("pubkey packetversion: " + this.packet[offset]);
	if(this.packet[offset] != 4) return null; //only version4 packets accepted
	var retval = {body_offset: offset + 6};
	retval.algorithm = this.packet[offset + 5];
	return retval;
    },
    _init_preparsed: function(packet){
	this.packet = packet;
	$.extend(this, this._parse_header(0));
	this.log("packet_tag: " + this.packet_tag);
 	if(this.packet_tag == 13) return this.get_id();
	if(this.packet_tag == 6) return this.get_keys();
	return this;
    },
    _init: function(packet){
	var array64 = packet.split("\n");
	var decoded = base64.decode(array64.slice(3, array64.length - 3).join(""));
	if(decoded) {
	    this._init_preparsed(decoded);
	} else return null;
    },
    _bint256: int2bigInt(256,9,1),
    baToBInt: function(ba, start, stop){
	var retval = int2bigInt(0,8,1);
	for(i = start; i <= stop; i++){
	    retval = add(mult(retval, this._bint256), int2bigInt(ba[i],8,1)); 
	}
	return retval;
    },
    get_id: function(){
	this.id = this.ba2string(this.packet.splice(this.body_offset, this._next_packet_offset -1));
	var id = this.id;
	var i_idx = id.lastIndexOf(">");
	if (i_idx != -1) id = id.slice(0, i_idx + 1);
	this.id = id;
	return this;
    },
    get_keys: function(){
	var offset = this.body_offset;
	var header;
	var laufen = true;
	var retval = [];
	while(laufen){
	    header = this._parse_pubkey_header(offset);
	    if(header && header.algorithm == 1) {
		retval = {"rsa": this._get_mpis(2 ,offset + 6)};
		this.log("rsa-key gefunden:");

		offset = this._skip_mpis(2, offset + 6);
	    }
	    else if(header && header.algorithm == 17) {
		retval.push({"dsa": this._get_mpis(4,offset + 6)});
		offset = this._skip_mpis(4, offset + 6);
	    }
	    else laufen = false;
	}
	this._next_packet_offset = offset;
	//this.log("remainder of packet after the key: " + this.packet.splice(offset));
	this.keymaterial = retval;
	return this;
    },
    get_next_packet: function(){
	if(this._next_packet_offset){
	    var new_packet = this.packet.slice(this._next_packet_offset);
	    this.log("parsing next packet, length: " + new_packet.length);
	    return new GPGPackageParser($.extend([], new_packet));
	}
	else return null;
    },
    get_signature_values: function(){
	var offset = this.body_offset,
	    retval = {};
	retval.signature_version = this.packet[offset];
	retval.signature_type = this.packet[offset + 1];
	retval.signature_algo = this.packet[offset + 2];
	if(retval.signature_algo == 1) retval.signature_algo = "rsa";
	else if(retval.signature_algo == 17) retval.signature_algo = "dsa";
	retval.signature_hash_algo = this.packet[offset + 3];
	if(retval.signature_hash_algo == 2) retval.signature_hash_algo = "SHA1";
	var hashed_subpacket_data_count = (this.packet[offset + 4] * 256) + this.packet[offset + 5];
	retval.hashed_subpackets = this._get_sig_subpackets(offset + 6, hashed_subpacket_data_count);
	offset = this.body_offset + 6 + hashed_subpacket_data_count; //offset is now after the hashed subpacket data :)
	retval.value_to_hash = this.packet.slice(this.body_offset, offset);
	var subpacket_data_count = (this.packet[offset] * 256) + this.packet[offset + 1];
	//this.log("Laenge der Subpakete: " + subpacket_data_count);
	retval.subpackets = this._get_sig_subpackets(offset + 2, subpacket_data_count);
	var subpackets = retval.subpackets.concat(retval.hashed_subpackets);
	retval.issuer = this.reduce(function(a,b){
	    if(b.type == 16) return b.data; //issuer subpacket found
	    else return a;
	},null,subpackets);
	this.log("issuer: " + retval.issuer);
	retval.issuer = this.ba2hex(retval.issuer);
	offset = offset + 2 + subpacket_data_count; //offset is now after the subpacket data
	retval.first16bit_hash = (this.packet[offset] * 256) + this.packet[offset + 1];
	if(retval.signature_algo == "rsa") retval.signature = this._get_mpis(1,offset + 2);
	else if (retval.signature_algo == "dsa") retval.signature = this._get_mpis(2,offset + 2);
	this.signature = $.extend(this.signature,retval);
	return this;
    },
    string2byteArray: function(str){
	    var ba= [];
	    for(var i=0;i<str.length; i++){
		ba.push(str.charCodeAt(i));
	    }
	    return ba;
    },
    ba2hex: function(ba) {
	var hexchars = "0123456789abcdef",
	    retval = "",
	    i = 0;
	for(i  in ba){
	    var char1 = ba[i] >> 4,
		char2 = ba[i] & 0xf;
	    retval = retval + hexchars.charAt(char1) + hexchars.charAt(char2);
	}
	return retval;
    },
    ba2string: function(ba){
	return String.fromCharCode.apply(this, ba);
    },
    get_signature_hash: function(){
	if(! this.signature) return null;
	if(! this.signature.signature_version) this.get_signature_values();
	var hash_appender_as_string = pidCryptUtil.byteArray2String(this.signature.value_to_hash);
	var val_to_hash = this.signature.signature_content + hash_appender_as_string + this.ba2string([4, 255, 0, 0, 0, 12]);
	this.log("string from which sha1 is computed: ||" + val_to_hash + "||\n" +
		 "as byte-array: " + this.string2byteArray(val_to_hash));
	//this.log("sha1 from content only: " + pidCrypt.SHA1(this.signature.signature_content));
	var sig_hash;
	if(this.signature.signature_hash_algo == 8) sig_hash = pidCrypt.SHA256(val_to_hash);
	else if(this.signature.signature_hash_algo == 2 ||
		this.signature.signature_hash_algo == "SHA1") sig_hash = pidCrypt.SHA1(val_to_hash);
	else {
	    sig_hash = "";
//      console.log("unknown hash algorithm, algo id: " + this.signature.signature_hash_algo);
	}
	if (this.signature.first16bit_hash.toString(16) == sig_hash.slice(0,4))
	    return sig_hash;
	else {
//      console.log("get_signature_hash failed, 4 control-bytes did not match");
	    return null;
	}
    },
    _get_sig_subpackets: function(offset, length){
	var retval = [],
	    packet = this.packet,
	    i = 0,
	    laufen = true,
	    offs = offset;
	var parse_length = function(offs){
	    if(packet[offs] < 192) return 1;
	    if(packet[offs] >= 192 && packet[offs] < 255) return 2;
	    if(packet[offs] == 255) return 5;
	    return null;
	};

	while(laufen) {
	    var reti = {};
	    reti.length_of_length = parse_length(offs);
	    if(reti.length_of_length){
		if(reti.length_of_length == 1) reti.length = packet[offs];
		offs += reti.length_of_length;
		reti.type = packet[offs];
		reti.data = packet.slice(offs + 1, offs + reti.length);
		retval.push(reti);
		offs += reti.length;
		if(offs >= offset + length) laufen = false;
	    } else laufen = false;
	}
	return retval;
    },
    _get_mpis: function(n, offset){
	var position = offset;
	var retval = [];
	var new_pos = 0;
	var i = 0;
	while(i < n){
	    this.log("In _get_mpis #mpi: " + i + ", position: " + position + ", mpi length in Bit: " + ((this.packet[position] * 256) + this.packet[position + 1]) + ", mpi-length-bytes: " + this.packet[position] + ", " + this.packet[position + 1]);
	    new_pos = position + 2 + Math.floor((((this.packet[position] * 256) + this.packet[position + 1] + 7)/8));
	    retval.push(this.baToBInt(this.packet, position + 2, new_pos -1));
	    this.log("mpi calculated: " + bigInt2str(retval[retval.length -1], 10));
	    position = new_pos;
	    i = i + 1;
	}
	return retval;
    },
    _skip_mpis: function(n, offset){
	var retval = offset;
	for(i = 0; i < n; i++){
	    retval = retval + 2 + Math.floor((((this.packet[retval] * 256) + this.packet[retval + 1] + 7)/8));
	    this.log("skip_mpis, new_position: " + retval);
	}
	return retval;
    },
}

