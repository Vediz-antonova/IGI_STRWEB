FROM python

RUN apt-get update && apt-get install -y git

RUN git clone https://github.com/smartiqaorg/geometric_lib.git /app/geometric_lib

COPY main.py /app

WORKDIR /app

ENV SHAPE=circle
ENV SIZE=10

CMD [ "python", "main.py" ]