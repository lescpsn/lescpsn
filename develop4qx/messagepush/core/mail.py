import tornado
import smtplib
from os.path import basename
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE, formatdate
# send_account #发件人邮箱账号
# send_password #发件人邮箱密码
# rev_list #收件人邮箱地址列表
# mail_title  #邮件标题
# mail_text  #邮件的文本内容
# mail_file_list #邮件附件列表
@tornado.gen.coroutine
def send_mail(application, send_account, send_password, send_smtp_address, send_smtp_port,rev_list, mail_title, mail_text, mail_file_list=None):
    '''
    Content-Type: application/octet-stream;
        name="=?GB2312?B?w7/I1cOrwPux7S54bHN4?="
    Content-Transfer-Encoding: base64
    Content-Disposition: attachment;
        filename="=?GB2312?B?w7/I1cOrwPux7S54bHN4?="
    '''
    assert isinstance(rev_list, list)

    msg = MIMEMultipart()
    msg['From'] = send_account
    msg['To'] = COMMASPACE.join(rev_list)
    msg['Date'] = formatdate(localtime=True)
    msg['Subject'] = mail_title

    msg.attach(MIMEText(mail_text))

    if mail_file_list:
        for f in mail_file_list:
            print(basename(f))
            with open(f, "rb") as fil:
                part = MIMEApplication(fil.read())
                part.add_header('Content-Type', 'application/octet-stream;name="%s"' % basename(f))
                part.add_header('Content-Disposition', 'attachment; filename="%s"' % basename(f))
                msg.attach(part)

    smtp = smtplib.SMTP_SSL(send_smtp_address, send_smtp_port)
    smtp.login(send_account, send_password)

    smtp.sendmail(send_account, rev_list, msg.as_string())
    smtp.close()

if __name__ == '__main__':
    send_account = 'send_account'
    send_password = 'send_password'
    send_smtp_address = 'send_smtp_address'
    send_smtp_port = 'send_smtp_port'
    rev_list = 'rev_list'
    mail_title = 'mail_title'
    mail_text = 'mail_text'
    mail_file_list = 'mail_file_list'

    send_mail(send_account, send_password, send_smtp_address, send_smtp_port, rev_list, mail_title, mail_text, mail_file_list)
