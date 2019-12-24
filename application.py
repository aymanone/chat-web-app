import os
import sys
import re 
from datetime import datetime
from flask import Flask,jsonify,render_template,request,redirect,url_for,Markup,send_from_directory
from flask_socketio import SocketIO, emit,Namespace
from werkzeug import secure_filename
import requests


app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["UPLOAD_FOLDER"]=os.getenv("UPLOAD_FOLDER")
app.config["MAX_CONTENT_LENGTH"]=int(os.getenv("MAX_CONTENT_LENGTH"))
app.config["ALLOWED_UPLOAD_FILES"]=["DOCX","JPEG","JPG","PNG","GIF","TXT","MP3"]
socketio = SocketIO(app)
channel_list=[]
channels_dict={}
names={}
passwords={}
not_allowed_chars=re.compile('[@_!#$%^&*()<>?/\|}{~:]') 
def allowed_upload_file(file):
    if file.filename==None or file.filename=="":
        return False
    if not "."  in file.filename:
        return False
    ext=file.filename.rsplit(".",1)[1]
    if not ext.upper() in app.config["ALLOWED_UPLOAD_FILES"]:
        return False
    return True
def valid_channel_and_user(channel,email):
    return channel in channels_dict and email in names
@app.route("/")
def index():
    return render_template("index.html")
@app.route("/add_user",methods=["POST"])
def add_user():
    name=request.form.get("name")
    mail=request.form.get("mail")
    password=request.form.get("password")
    if name=='' or mail=='' or len(password)<6:
        return jsonify({"not_valid":"missing mail or name or vaid password","done":False})
    if "@" not in mail or "." not in mail :
        return jsonify({"not_valid":"unvalid mail","done":False})
    if mail in names:
        return jsonify({"not_valid":"user exists","done":False})
    if name in names.values():
        return jsonify({"not_valid":"the name is already there","done":False})
    if  not_allowed_chars.search(name):
        return jsonify({"not_valid":"don't include special characters","done":False})
    names[mail]=name
    passwords[mail]=password
    return jsonify({"done":True})
@app.route("/sign_in",methods=["POST"])
def sign_in():
    mail=request.form.get("mail")
    password=request.form.get("password")
    if mail not in names or passwords[mail]!=password:
        return jsonify({"not_valid":"something wrong with mail or password","done":False})
    name=names[mail]
    return jsonify({"done":True,"name":name})
@app.route("/channels")
def channels():
    return render_template("channels.html",channels=channel_list)

@socketio.on("add_channel",namespace="/channels")
def add_channel(data):

    channel=data["channel"]
    if channel in channel_list:
        emit("new_one",{"error":"channel there"})
        return
    if not_allowed_chars.search(channel):
        emit("new_one",{"error":"can't use special chars in the channel name"})
        return
    channel_list.append(channel)
    channels_dict[channel]=[]
    emit("new_one",{"channel":channel},broadcast=True)
@app.route("/channels/<string:channel>",methods=["GET"])
def display_channel(channel):
    if channel not in channel_list or channel not in channels_dict:
        return render_template("error.html",msg="we don't have this channel")
    msgs=channels_dict[channel]
    return render_template("channel.html",data={"channel":channel,"msgs":msgs})
class handle_channel(Namespace):
    def on_connect(self):
        pass
    def on_disconnect(self):
        pass
    def on_add_msg(self,data):
        channel=data["channel"]
        mail=data["senderMail"]
        if not valid_channel_and_user(channel,mail):
            return render_template("error.html",msg="you're trying to fool me")
        msg=data["msg"]
        if msg=='':
            pass
        else:
            sender=names[mail]
            message={"sender":sender,"message":msg,"mail":mail}
            channels_dict[channel].append(message)
            emit(f"{channel} new_msg",message,broadcast=True)

socketio.on_namespace(handle_channel("/channels/channel"))
@app.route("/uploader",methods=["POST"])
def uplaoder():
    channel=request.form.get("channel")
    mail=request.form.get("email")
    if not valid_channel_and_user(channel,mail):
        return render_template("error.html",msg="we don't have this channel")
    try:
        file=request.files["file"]
    except Exception as e :
        if e.__class__.__name__=="RequestEctityTooLarge":
            return jsonify({"done":False,"not_valid":"file is too large"})
        file=None
    if not file:
        return jsonify({"done":False,"not_valid":"no file choosen"})
    if not allowed_upload_file(file)  :
        return jsonify({"done":False,"not_valid":"we can't allow this file for type or another thing"})
    date=datetime.utcnow().strftime( "%Y-%m-%dT%H:%M:%S")
    user=names[mail]
    filename=user+"_"+date+"_"+file.filename
    data={"filename":filename,"user":user}
    file.save(os.path.join(app.config["UPLOAD_FOLDER"],secure_filename(filename)))
    msg=Markup(f"<a href='/files/download/{filename}'>{file.filename}</a>")
    sender=user 
    mail=request.form.get("email")
    message={"sender":sender,"message":msg,"mail":mail,"isMarkUp":True}
    channels_dict[channel].append(message)
    socketio.emit(f"{channel} new_msg",message,broadcast=True,namespace="/channels/channel")
    return jsonify({"done":True})
@app.route("/files/download/<path:filename>",methods=["POST","GET"])
def download(filename):
    uploads = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'])
    filename=secure_filename(filename)
    print(uploads," ",filename,file=sys.stdout)
    return send_from_directory(directory=uploads, filename=filename)
@app.route("/delete_user_messages",methods=["GET"])
def delete_user_messages():
    return render_template("delete_user_messages.html")
@app.route("/confirm_messages_delete",methods=["POST"])
def confirm_messages_delete():
    mail=request.form.get("mail")
    password=request.form.get("password")
    if mail==None or not mail in names:
        return jsonify({"dont":False,"not_valid":"something wrong with the mail"})
    if password==None or password!=passwords[mail]:
        return jsonify({"done":False,"not_valid":"something wrong with the password"})
    user=names[mail]
    #remove messages
    for channel in channels_dict.values():
        channel=filter(lambda msg:msg.sender!=user,channel)
    #remove files he download
    uploads = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'])
    folder=os.listdir(uploads)
    for File in folder:
        if File.startswith(user+"_"):
            file_path=os.path.join(uploads,File)
            os.remove(file_path)

    return jsonify({"done":True})
