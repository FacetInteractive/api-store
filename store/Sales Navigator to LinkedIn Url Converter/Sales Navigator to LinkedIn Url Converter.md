## Value prop'
[...]

# What do you need? ⚙️ 

1. Your session Cookie from your LinkedIn Sales Navigator account.
1. The link of a Google Spreadsheet with LinkedIn profile URLs in it.

_(**You already have all that?**  Click straight away on **"Use this API"**)_

## How long does that take to set up this amazing hack?
It will take you no more than **2 minutes**. 🕒

## What do you need to do?

### 1. Use this API on your account.👌
_(If you don't have an account yet, follow [me](https://phantombuster.com/register))_ 

<center><button type="button" class="btn btn-warning callToAction" onclick="useThisApi()">USE THIS API!</button></center>


### 2. Click on Configure me!
You'll now see the 3 configuration dots blinking. Click on them.

<center>![](https://phantombuster.imgix.net/api-store/Linkedin_Post_commenters/configure_me.JPG)</center>


### 3. Linkedin authentication 🔑 { argument }
_(You already know how to get your sessionCookie? <a href="#section_posturl">skip this part</a>)_  
Because the script will manipulate LinkedIn for you, it needs to be logged on your LinkedIn account. For that you just need to copy paste your session cookie in the script argument:
* Using Chrome, go to your LinkedIn homepage and open the inspector  
→ Right click anywhere on the page and select “Inspect” ![](https://phantombuster.imgix.net/api-store/Inspect+browser.png)  
→ <kbd>CMD</kbd>+<kbd>OPT</kbd>+<kbd>i</kbd> on macOS  
or  
→ <kbd>F12</kbd> or <kbd>CTRL</kbd>+<kbd>MAJ</kbd>+<kbd>i</kbd> on Windows

* Locate the “Application” tab

<center>![](https://phantombuster.imgix.net/api-store/li_at+1.png)</center>

* Select “Cookies” > “http://www.linkedin.com” on the left menu.

<center>![](https://phantombuster.imgix.net/api-store/li_at+2.png)</center>

* Locate the “li_at” cookie.

<center>![](https://phantombuster.imgix.net/api-store/li_at+3.png)</center/>

* Copy what’s under “Value” (**Double click** on it then <kbd>Ctrl</kbd>+<kbd>C</kbd>) and paste it into your script _Argument_)

<center>![](https://phantombuster.imgix.net/api-store/linkedin_group_members/session_cookiee.JPG)</center>

<center>_Replace the selected area with your sessionCookie_</center>

_// How to access your cookies with <a href="https://docs.microsoft.com/en-us/microsoft-edge/f12-devtools-guide/debugger/webstorage-in-debugger" target="_blank">Edge</a>, <a href="https://developer.mozilla.org/en-US/docs/Tools/Storage_Inspector" target="_blank">Firefox</a> and <a href="https://www.macobserver.com/tmo/article/see_full_cookie_details_in_safari_5.1" target="_blank">Safari</a>//_


### 4. Add a Google Spreadsheet 📑
Below your sessionCookie you’ll find spreadsheetUrl

Add, in between double quotes, a link of a Google spreadsheet with this same format _(only column A is mandatory)_:
<center>![](https://phantombuster.imgix.net/api-store/1-Spreadsheet.png)</center>

Add every linkedIn profiles link in column A (**one link per row**)

### 5. Name your future CSV
Just add in between double quotes the name of your brand new CSV!

Click on 💾 <span style="color:blue">Save</span>

## Click on Launch & Enjoy!
It’s done! You only have to click on “Launch” and try your script. 

<center>![](https://phantombuster.imgix.net/api-store/launch.JPG)</center>

Once the script has finished his work, download the CSV by clicking on "**Link (download/share)**"

<center>![](https://phantombuster.imgix.net/api-store/Linkedin_Post_commenters/download.png)</center>



---


Now that you have your CSV, you can import it into a new Google Spreadsheet and use our script <a href="https://phantombuster.com/api-store/2818/linkedin-network-booster" target="_blank">LinkedIn Network Booster</a> to add every commenters with a personnalized message.