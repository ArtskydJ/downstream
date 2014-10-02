downstream
==========

NodeJS app to download livestream videos.

Not fully functional. If you have experience with this sort of thing, maybe take a look at the source code?

##Use

1. Download and install [NodeJS](nodejs.org/download). During installation, make sure to install the option to `Add to PATH`.
2. In your browser, find the livestream video you want to download. Click `Share`, then copy the link.
3. Open command prompt/terminal. Run the following commands:

The following command will determine the directory where this app gets installed, and where the videos get downloaded to:

	cd C:/Users/YOUR_USERNAME_HERE/Downloads

The following command will download and install this app:

	npm install downstream

The following command will run this app on the link you want.

	node . SHARE_LINK_HERE

That's it!

I have not had much success with this, IDK what the problem is. It's probably and issue with encoding. If you're good with that stuff, maybe check out the source and give a few pointers. If you're feeling really generous, fix it, and make a pull request! I'd be really grateful! :D

##License

[MIT/X11](http://opensource.org/licenses/MIT)
