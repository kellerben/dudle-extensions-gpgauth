require "dudletest"
YES   = "a_yes__"
NO    = "c_no___"
MAYBE = "b_maybe"

A = OpenStruct.new(
	:name => "Alice",
	:vote => [NO,YES,MAYBE]
)
B = OpenStruct.new(
	:name => "Bob",
	:vote => [YES,YES,NO]
)
C = OpenStruct.new(
	:name => "Carol",
	:vote => [YES,NO,YES]
)
D = OpenStruct.new(
	:name => "Dave",
	:vote => [YES,YES,YES]
)
M = OpenStruct.new(
	:name => "Mallory",
	:vote => [MAYBE,NO,YES]
)

def vote_to_i(v)
	v.class == String ? (v == YES ? 1 : 0) : v
end

class Array
	def add_indexwise other
		raise "Can only add two arrays with same size" if self.size != other.size
		ret = []
		self.each_with_index{|e,i| ret[i] = vote_to_i(self[i]) + vote_to_i(other[i]) }
		ret
	end
end

class ParticipateTest  < Test::Unit::TestCase
	include DudleTest

	def setup_poll
		@s.open("/?lang=en")
	end
	def setup_poll_sym
		@s.open("/example.cgi?poll=symcrypt_participate_test")

		# this does not work, doing manual redirect wait
		#@s.wait_for_page_to_load("3000")
		#@s.wait_for({:wait_for => :element, :element => "active_tab" })
		while @s.location =~ /example.cgi/
			sleep 0.1 # wait for redirect
			puts "sleeping"
		end

		location = @s.location
		@s.open("/")
		@s.open(location + "#passwd=blabla")
		wait_for_ajax
	end
	def setup_poll_asym
		@s.open("/example.cgi?poll=asymcrypt_participate_test")

		# this does not work, doing manual redirect wait
		#@s.wait_for_page_to_load("3000")
		#@s.wait_for({:wait_for => :element, :element => "active_tab" })
		while @s.location =~ /example.cgi/
			sleep 0.1 # wait for redirect
			puts "sleeping"
		end

		location = @s.location
		wait_for_ajax
	end


	def vote(user)
		vote_nosig(user)
		sign
		send_sig
	end
	def vote_nosig(user)
		@s.type("add_participant_input", user.name)
		user.vote.each_with_index{|vote,index|
			@s.click("//tr[@id='add_participant']//td[@class='checkboxes'][#{index+1}]//tr[@class='input-#{vote}']//input")
		}

		@s.click("savebutton")
		wait_for_ajax
	end
	def sign
		signText = @s.value("signText")
		tmpfile = "/tmp/participatetest.#{rand(9999)}"
		File.open(tmpfile,"w"){|f| f << signText }
		`gpg -o #{tmpfile}.asc --clearsign #{tmpfile}`
		signed = File.open("#{tmpfile}.asc","r").read
		@s.type("signText",signed)
		File.delete(tmpfile)
		File.delete("#{tmpfile}.asc")
	end
	def send_sig
		@s.click("//input[@value='Save']")
		wait_for_ajax
	end
	def decrypt
		assert(@s.text?('There are encrypted votes.'))
		@s.click("//td[contains(text(),'There are encrypted votes.')]")
		@s.get_xpath_count("//tr[@class='participantrow']//textarea").to_i.times{|i|

			# @s.text would remove \n, doing dirty bullshit here
			@s.run_script("var tmpParticipateTest = $('#encRow#{i}').text()")
			gpgtext = @s.get_eval("this.browserbot.getCurrentWindow().tmpParticipateTest")

			tmpfile = "/tmp/participatetest.#{rand(9999)}"
			File.open("#{tmpfile}.gpg","w"){|f| f << gpgtext }
			`gpg -o #{tmpfile} --decrypt #{tmpfile}.gpg`
			cleartext = File.open("#{tmpfile}","r").read
			@s.type("//tr[@id='encRow#{i}']//textarea",cleartext)
			@s.run_script("$('#encRow#{i} textarea').focusout()")
			File.delete(tmpfile)
			File.delete("#{tmpfile}.gpg")
		}
	end
	def reload
		@s.refresh
		wait_for_all
	end
	def assert_voteResult(userarray)
		voteresult = [0] * userarray[0].vote.size
		userarray.each{|user|
			voteresult = voteresult.add_indexwise(user.vote)
		}
		voteresult.each_with_index{|sum, index|
			assert_equal(sum.to_s, @s.text("//tr[@id='summary']//td[#{index+2}]"), "Index #{index} was wrong")
		}
	end
	def set_sig(check)
		l = @s.location
		@s.open("/customize.cgi")
		@s.click("useGPG") unless @s.checked?("useGPG") == check
		@s.open(l)
		wait_for_ajax
	end
#   def test_symInconsistent
	#   FIXME: does not work yet
#     setup_poll_sym
#     set_sig(true)
#     vote_nosig(A)
#     sign
#     signTextA = @s.value("signText")
#     reload
#     vote_nosig(B)
#     @s.type("signText",signTextA)
#     send_sig
#     assert_voteResult([A])
#   end
	def test_checkbox
		setup_poll_sym
		set_sig(false)
		assert(!@s.text?("Sign Vote"))
		set_sig(true)
		assert(@s.text?("Sign Vote"))
	end
	def assert_signed(user)
		# FIXME: more tests!
		assert(@s.element?("//tr[@id='#{user.name}_tr']//img[@class='GPGAuthSigned']"))
	end
	def assert_notsigned(user)
		assert(!@s.element?("//tr[@id='#{user.name}_tr']//img[@class='GPGAuthSigned']"))
	end
	def test_symCheckbox
		setup_poll_sym
		set_sig(true)
		assert("Next",@s.value("savebutton"))
		vote(A)
		assert_signed(A)
		assert_voteResult([A])

		assert(@s.checked?("useGPG"))

		@s.click("useGPG")
		assert(!@s.checked?("useGPG"))
		reload
		assert(@s.checked?("useGPG"))
		assert_signed(A)
		assert_voteResult([A])

		@s.click("useGPG")
		assert(!@s.checked?("useGPG"))
		assert_equal("Save",@s.value("savebutton"))

		vote_nosig(B)
		assert_voteResult([A,B])
		assert(!@s.checked?("useGPG"))
		reload
		assert_voteResult([A,B])

		vote(D)
		vote(C)

		assert(@s.checked?("useGPG"))
		assert_voteResult([A,B,C,D])

		reload
		assert(@s.checked?("useGPG"))
		assert_voteResult([A,B,C,D])
	end
	def test_symChangeSig2NosigEdit
		setup_poll_sym
		set_sig(true)
		vote(A)
		assert_signed(A)
		@s.click("//a[@title='Edit User #{A.name} ...']")
		@s.click("useGPG")
		@s.click("savebutton")
		assert_notsigned(A)
	end
	def test_symChangeSig2Nosig
		setup_poll_sym
		set_sig(true)
		vote(A)
		assert_signed(A)
		set_sig(false)
		@s.click("//a[@title='Edit User #{A.name} ...']")
		@s.click("savebutton")
		assert_notsigned(A)
	end
	def test_symChangeNosig2Sig
		setup_poll_sym
		set_sig(false)
		vote_nosig(A)
		assert_notsigned(A)
		set_sig(true)
		@s.click("//a[@title='Edit User #{A.name} ...']")
		@s.click("savebutton")
		sign
		send_sig
		assert_signed(A)
	end
#   def test_asym
		# FIXME: unimplemented
#     setup_poll_asym
#     vote(A)
#     reload
#     decrypt
#     assert_voteResult([A])
#     vote(B)
#     reload
#     vote(C)
#     decrypt
#     assert_voteResult([A,B,C])
#   end

end

