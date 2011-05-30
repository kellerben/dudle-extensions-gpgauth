require "pp"
require "test/unit"
require "optparse"
require "ostruct"
require "rubygems"
gem "selenium-client"
require "selenium/client"

module DudleTest 

	@@options = OpenStruct.new
	@@options.speed = 0
	@@options.leavepoll = true
	@@options.fast_setup = true
	@@options.highlight = false
	@@options.browser = "*custom /usr/bin/google-chrome --proxy-server=localhost:4444"

	OPTPARSE = OptionParser.new{|opts|
		opts.on('--[no-]fast-setup', 'clone the repo for faster setup', "default: #{@@options.fast_setup}"){|bool|
			@@options.fast_setup = bool
		}
		opts.on('-s', '--slow', 'make it slow (+1s)'){|bool|
			@@options.speed += 500
		}
		opts.on('-h','--highlight', 'Highlight located elements'){|bool|
			@@options.highlight = bool
		}
		opts.on("--messie", "do not clean up the poll afterwards"){|bool|
			@@options.leavepoll = bool
		}
		opts.on("--browser (epiphany|firefox|opera|iexplore|chromium|chrome)", "use a specific browser"){|string|
			case string
			when "chrome"
				@@options.browser = "*custom /usr/bin/google-chrome --proxy-server=localhost:4444"
			when "chromium"
				@@options.browser = "*custom /usr/bin/chromium-browser"
			when "epiphany"
				@@options.browser = "*custom /usr/bin/epiphany"
			when "firefox", "opera", "iexplore"
				@@options.browser = "*#{string}"
			else
				puts "Unknown browser: #{string}"
				exit
			end
		}
	}

	def setup
			begin
				OPTPARSE.parse!
			rescue => e
				puts e
				puts OPTPARSE
				exit
			end

			@s = Selenium::Client::Driver.new(
				:host => "localhost",
				:port => 4444,
				:browser => @@options.browser,
				:url => "http://nebulus.inf.tu-dresden.de/",
				:highlight_located_element => @@options.highlight,
				:timeout_in_seconds => 30
			)

			@s.start_new_browser_session
			@s.delete_all_visible_cookies
			@s.create_cookie("lang=en; path=/;")

			@pollid = rand(999999999)

			setup_poll
			@s.set_speed(@@options.speed)
	end

	def setup_poll
		assert(false,"implement me")
#     raise "Implement setup_poll"
	end

	def teardown
		unless @@options.leavepoll
			@s.open("/#{@pollid}/delete_poll.cgi?confirmnumber=0&confirm=phahqu3Uib4neiRi")
#       @s.type("css=input[type=text]", @s.text("content").scan(/please type “(.*)” into the form/).flatten[0])
#       @s.submit("css=form")
			@s.wait_for_page_to_load("3000")
		end
		@s.close_current_browser_session
	end

	def wait_for_all
		@s.wait_for_page_to_load("3000")
		wait_for_ajax
	end
	def wait_for_ajax
		@s.wait_for({:wait_for => :ajax, :javascript_framework => :jquery})
	end

end
