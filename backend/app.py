from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import jwt
import datetime

app = Flask(__name__)
CORS(app)

SECRET_KEY = "your-secret-key"

# MySQL Connection

def connect():

    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="8411",
        database="canteen_app"
    )
    cursor = db.cursor(dictionary=True)

    return db

# ---------------------------
# Student Registration
# ---------------------------
@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    batch = data.get('batch')

    try:
        connection = connect()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM student WHERE student_email = %s", (email,))
        if cursor.fetchone():
            return jsonify({'message': 'Email already registered'}), 409

        cursor.execute(
            "INSERT INTO student (student_name, student_email, student_password, student_batch) VALUES (%s, %s, %s, %s)",
            (name, email, password, batch)
        )
        connection.commit()
        return jsonify({'message': 'Registration successful'}), 201
    
    except Exception as e:
        print(e)
        return jsonify({'message': 'Error: ' + str(e)}), 500
    
  


@app.route('/login/student', methods=['POST'])
def login_student():
    data = request.json
    email = data['email']
    password = data['password']

    connection = connect()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("SELECT * FROM student WHERE student_email = %s AND student_password = %s", (email, password))
    user = cursor.fetchone()
    if not user:
        return jsonify({'message': 'Invalid credentials'}), 401

    token = jwt.encode({
        'student_id': user['student_id'],
        'role': 'student',
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({'token': token})

# ---------------------------
# Admin Registration
# ---------------------------
@app.route('/register/admin', methods=['POST'])
def register_admin():
    data = request.json
    name = data['name']
    email = data['email']
    password = data['password']

    cursor.execute("SELECT * FROM canteen_admin WHERE admin_email = %s", (email,))
    if cursor.fetchone():
        return jsonify({'message': 'Admin already exists'}), 400

    cursor.execute("INSERT INTO canteen_admin (admin_name, admin_email, admin_password) VALUES (%s, %s, %s)",
                   (name, email, password))
    db.commit()
    return jsonify({'message': 'Admin registered successfully'}), 200

# ---------------------------
# Admin Login
# ---------------------------
@app.route('/login/admin', methods=['POST'])
def login_admin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        conn = connect()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM canteen_admin WHERE admin_email = %s AND admin_password = %s", (email, password))
        admin = cursor.fetchone()

        if not admin:
            return jsonify({'message': 'Invalid credentials'}), 401

        token = jwt.encode({
            'admin_id': admin['admin_id'],
            'role': 'admin',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }, SECRET_KEY, algorithm='HS256')

        return jsonify({'token': token}), 200

    except Exception as e:
        return jsonify({'message': 'Login error', 'error': str(e)}), 500
 

@app.route('/today_bookings', methods=['GET'])
def get_bookings_by_student():
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'Authorization header missing'}), 401

        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        student_id = decoded.get('student_id')

        if not student_id:
            return jsonify({'message': 'Invalid token - student_id not found'}), 400

        conn = connect()
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM orders WHERE student_id = %s AND DATE(date) = CURDATE()"
        cursor.execute(query, (student_id,))
        bookings = cursor.fetchall()

        for b in bookings:
            if isinstance(b.get('date'), datetime.datetime):
                b['date'] = b['date'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()
        return jsonify(bookings), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': 'Error retrieving bookings', 'error': str(e)}), 500

@app.route('/book', methods=['POST'])
def create_booking():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]

    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        student_id = decoded.get('student_id')
        if not student_id:
            return jsonify({'message': 'Invalid token: student_id missing'}), 400
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    data = request.get_json()
    meal_type = data.get('type')
    now = datetime.datetime.now()

    try:
        conn = connect()
        cursor = conn.cursor(dictionary=True)

        # Check if student already booked this meal today
        query = """
            SELECT * FROM orders
            WHERE student_id = %s AND type = %s AND DATE(date) = CURDATE()
            ORDER BY date DESC LIMIT 1
        """
        cursor.execute(query, (student_id, meal_type))
        existing = cursor.fetchone()

        if existing:
            if existing['status'] == 'booked':
                return jsonify({'message': 'Meal already booked'}), 409
            elif existing['status'] == 'cancelled':
                booking_time = existing['date']
                if (now - booking_time).total_seconds() <= 1800:
                    # Restore cancelled booking
                    cursor.execute(
                        "UPDATE orders SET status = %s WHERE order_id = %s",
                        ('booked', existing['order_id'])
                    )
                    conn.commit()
                    return jsonify({'message': 'Cancelled booking reactivated'}), 200

        # Insert a new booking
        insert = """
            INSERT INTO orders (student_id, otp, status, date, type)
            VALUES (%s, %s, %s, %s, %s)
        """
        otp = "123456"  # Generate proper OTP in production
        status = "booked"
        cursor.execute(insert, (student_id, otp, status, now, meal_type))
        conn.commit()

        return jsonify({'message': 'Meal booked successfully'}), 201

    except Exception as e:
        return jsonify({'message': 'Error booking meal', 'error': str(e)}), 500
    

@app.route('/past_orders', methods=['GET'])
def get_past_orders():
    try:
        # Extract and verify token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Authorization header missing or invalid'}), 401

        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        student_id = decoded.get('student_id')

        print(student_id)

        if not student_id:
            return jsonify({'message': 'Invalid token - student_id not found'}), 400

        conn = connect()
        cursor = conn.cursor(dictionary=True)

        # Fetch orders with status 'completed' or 'booked' that are not for today
        query = """
            SELECT * FROM orders 
            WHERE student_id = %s 
            AND DATE(date) 
           
            ORDER BY date DESC
        """
        cursor.execute(query, (student_id,))
        past_orders = cursor.fetchall()

        for o in past_orders:
            if isinstance(o.get('date'), datetime.datetime):
                o['date'] = o['date'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()
        return jsonify(past_orders), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': 'Error retrieving past orders', 'error': str(e)}), 500



@app.route('/cancel/<int:order_id>', methods=['DELETE'])
def cancel_booking_by_id(order_id):
    try:
        conn = connect()
        cursor = conn.cursor(dictionary=True)

        # Fetch booking
        cursor.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
        booking = cursor.fetchone()

        if not booking:
            return jsonify({'message': 'Booking not found'}), 404

        # Check if already cancelled
        if booking['status'] == 'cancelled':
            return jsonify({'message': 'Booking already cancelled'}), 400

        # Check time limit (30 minutes)
        booking_datetime = booking['date']
        now = datetime.datetime.now()
        if (now - booking_datetime).total_seconds() > 1800:
            return jsonify({'message': 'Cancellation window expired'}), 403

        # Mark as cancelled
        cursor.execute(
            "UPDATE orders SET status = %s WHERE order_id = %s",
            ('cancelled', order_id)
        )
        conn.commit()

        return jsonify({'message': 'Booking marked as cancelled'}), 200

    except Exception as e:
        print("Cancel error:", e)
        return jsonify({'message': 'Error cancelling booking', 'error': str(e)}), 500




@app.route('/orders/student', methods=['GET'])
def get_orders_student():
    auth = request.headers.get('Authorization')
    if not auth:
        return jsonify({'message': 'Token missing'}), 403

    try:
        token = auth.split()[1]
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        student_id = decoded['student_id']
    except:
        return jsonify({'message': 'Invalid token'}), 403

    cursor.execute("SELECT * FROM orders WHERE student_id = %s", (student_id,))
    orders = cursor.fetchall()
    return jsonify({'orders': orders}), 200


@app.route('/admin/today-orders', methods=['GET'])
def get_all_today_orders(): 
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'message': 'Authorization token missing'}), 401

    token = auth_header.split(" ")[1]
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if decoded.get('role') != 'admin':
            return jsonify({'message': 'Unauthorized access'}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401

    try:
        conn = connect()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT o.* , s.student_name, s.student_batch 
            FROM orders o
            JOIN student s ON o.student_id = s.student_id
            WHERE DATE(o.date) = CURDATE()
            ORDER BY o.date DESC
        """
        cursor.execute(query)
        orders = cursor.fetchall()

        print(orders)

        for order in orders:
            if isinstance(order.get('date'), datetime.datetime):
                order['date'] = order['date'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()
        return jsonify(orders), 200

    except Exception as e:
        return jsonify({'message': 'Error retrieving orders', 'error': str(e)}), 500

@app.route('/admin/confirm-order', methods=['POST'])
def confirm_order_otp():
    auth_header = request.headers.get('Authorization')
    print(auth_header)
    # if not auth_header or not auth_header.startswith('Bearer '):
    
    #     return jsonify({'message': 'Authorization token missing'}), 401

    token = auth_header.split(" ")[1]
    # try:
    #     decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    #     if decoded.get('role') != 'admin':
    #         return jsonify({'message': 'Unauthorized access'}), 403
    # except jwt.ExpiredSignatureError:
    #     return jsonify({'message': 'Token expired'}), 401
    # except jwt.InvalidTokenError:
    #     return jsonify({'message': 'Invalid token'}), 401

    data = request.get_json()
    order_id = data.get('orderId')

    print(data)

    submitted_otp = data.get('otp')

    if not order_id or not submitted_otp:
        return jsonify({'message': 'Missing orderId or OTP'}), 400

    try:
        
        conn = connect()
        cursor = conn.cursor(dictionary=True)

        # Fetch the order
        cursor.execute("SELECT * FROM orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        print(order)

        if not order:
            return jsonify({'message': 'Order not found'}), 404

        if order['status'] == 'served':
            return jsonify({'message': 'Order already served'}), 400

        if order['otp'] != str(submitted_otp):
            return jsonify({'message': 'Incorrect OTP'}), 401

        # Mark the order as served
        cursor.execute("UPDATE orders SET status = 'served' WHERE order_id = %s", (order_id,))
        conn.commit()

        return jsonify({'message': 'Order confirmed successfully'}), 200

    except Exception as e:
        print(e)
        return jsonify({'message': 'Error confirming order', 'error': str(e)}), 500
    
@app.route('/admin/stats/monthly-meals')
def monthly_meals():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            MONTH(date) as month,
            type,
            COUNT(*) as total
        FROM orders
        WHERE status = 'served'
        GROUP BY MONTH(date), type
    """)
    data = cursor.fetchall()
    return jsonify(data)

@app.route('/admin/stats/weekly-meals')
def weekly_meals():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            DAYNAME(date) as day,
            type,
            COUNT(*) as total
        FROM orders
        WHERE status = 'served' AND YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)
        GROUP BY DAY(date), type
    """)
    data = cursor.fetchall()
    return jsonify(data)

@app.route('/admin/stats/average-daily')
def average_daily():
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            DAYNAME(date) as day,
            type,
            ROUND(AVG(count), 2) as average
        FROM (
            SELECT 
                DATE(date) as date,
                DAYNAME(date) as day,
                type,
                COUNT(*) as count
            FROM orders
            WHERE status = 'served'
            GROUP BY DATE(date), type
        ) as daily_counts
        GROUP BY day, type
    """)
    data = cursor.fetchall()
    return jsonify(data)




# ---------------------------
# Run the App
# ---------------------------
if __name__ == '__main__':
    app.run(debug=True)
