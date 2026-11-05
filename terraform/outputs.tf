output "instance_id" {
  value = aws_instance.vmpipeline.id
}

output "public_ip" {
  value = aws_instance.vmpipeline.public_ip
}

output "web_url" {
  value = "http://${aws_instance.vmpipeline.public_ip}"
}

output "ssh_command" {
  value = "ssh -i labsuser.pem ubuntu@${aws_instance.vmpipeline.public_ip}"
}
